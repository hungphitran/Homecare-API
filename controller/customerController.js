const Customer = require('../model/customer.model')
const Location = require('../model/location.model')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

// Helper: map address IDs (province/district/ward) to names from locations
async function mapAddressesWithLocationNames(addresses) {
    try {
        if (!Array.isArray(addresses) || addresses.length === 0) return addresses || [];

        // Collect unique valid province ObjectIds
        const provinceIdSet = new Set();
        for (const a of addresses) {
            const pid = a && a.province ? String(a.province) : null;
            if (pid && mongoose.Types.ObjectId.isValid(pid)) provinceIdSet.add(pid);
        }

        if (provinceIdSet.size === 0) {
            // Nothing to map, return as-is
            return addresses;
        }

        const provinceIds = Array.from(provinceIdSet);
        const provinces = await Location.find({ _id: { $in: provinceIds } }).lean();

        const provinceMap = new Map(provinces.map(p => [String(p._id), p]));

        const mapped = addresses.map(addr => {
            if (!addr) return addr;
            const result = { ...addr };

            const provinceId = addr.province && mongoose.Types.ObjectId.isValid(String(addr.province))
                ? String(addr.province)
                : null;
            const districtId = addr.district && mongoose.Types.ObjectId.isValid(String(addr.district))
                ? String(addr.district)
                : null;
            const wardId = addr.ward && mongoose.Types.ObjectId.isValid(String(addr.ward))
                ? String(addr.ward)
                : null;

            const provinceDoc = provinceId ? provinceMap.get(provinceId) : null;
            if (provinceDoc && provinceDoc.Name) {
                result.province = provinceDoc.Name;
            }

            if (provinceDoc && Array.isArray(provinceDoc.Districts) && districtId) {
                const districtDoc = provinceDoc.Districts.find(d => String(d._id) === districtId);
                if (districtDoc && districtDoc.Name) {
                    result.district = districtDoc.Name;
                }
                if (districtDoc && Array.isArray(districtDoc.Wards) && wardId) {
                    const wardDoc = districtDoc.Wards.find(w => String(w._id) === wardId);
                    if (wardDoc && wardDoc.Name) {
                        result.ward = wardDoc.Name;
                    }
                }
            }

            return result;
        });

        return mapped;
    } catch (e) {
        console.error('mapAddressesWithLocationNames error:', e);
        // Fallback to original addresses on any error
        return addresses || [];
    }
}

const customerController ={
    getOne: async(req,res,next)=>{
        try {
            const data = await Customer.findOne({phone:req.params.phone})
                .select('-password -__v -deleted -createdBy -updatedBy -deletedBy')
                .lean();

            if (!data) return res.status(404).json({ error: 'Customer not found' });

            const mappedAddresses = await mapAddressesWithLocationNames(data.addresses);
            return res.status(200).json({ ...data, addresses: mappedAddresses });
        } catch (err) {
            console.error('getOne customer error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getAll: async (req,res,next)=>{
        try {
            const data = await Customer.find({})
                .select('-password -__v -deleted -createdBy -updatedBy -deletedBy')
                .lean();

            // Batch map: collect all addresses then map per customer using one province fetch per invocation inside helper
            const result = await Promise.all(
                data.map(async (c) => ({
                    ...c,
                    addresses: await mapAddressesWithLocationNames(c.addresses)
                }))
            );

            return res.status(200).json(result);
        } catch (err) {
            console.error('getAll customers error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    update: async(req,res,next)=>{
        try {
            const { phone } = req.params;
            const updateData = { ...req.body };

            // Chỉ cho phép một số trường được cập nhật
            const allowedFields = ['fullName', 'email', 'addresses'];
            const sanitizedUpdate = {};
            for (const key of allowedFields) {
                if (Object.prototype.hasOwnProperty.call(updateData, key)) {
                    sanitizedUpdate[key] = updateData[key];
                }
            }

            // Nếu body không có trường hợp lệ nào
            if (Object.keys(sanitizedUpdate).length === 0) {
                return res.status(400).json({
                    error: 'No valid fields',
                    message: 'Chỉ được phép cập nhật các trường: fullName, email, addresses'
                });
            }

            // Validation email format nếu có
            if (sanitizedUpdate.email && sanitizedUpdate.email.trim() !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(sanitizedUpdate.email)) {
                    return res.status(400).json({
                        error: 'Invalid email format',
                        message: 'Email không đúng định dạng'
                    });
                }
            }

            // Validation fullName
            if (sanitizedUpdate.fullName && sanitizedUpdate.fullName.trim().length < 2) {
                return res.status(400).json({
                    error: 'Invalid fullName',
                    message: 'Tên phải có ít nhất 2 ký tự'
                });
            }

            // Validation addresses + chuẩn hóa theo yêu cầu: thay thế phần tử đầu tiên bằng địa chỉ mới
            let newAddressToApply = null;
            if (sanitizedUpdate.addresses !== undefined) {
                const payload = sanitizedUpdate.addresses;
                let addrObj = null;

                if (Array.isArray(payload)) {
                    // Nếu là mảng, chỉ lấy phần tử đầu tiên theo yêu cầu
                    addrObj = payload[0];
                } else if (payload && typeof payload === 'object') {
                    addrObj = payload;
                }

                if (!addrObj || typeof addrObj !== 'object') {
                    return res.status(400).json({
                        error: 'Invalid addresses',
                        message: 'addresses phải là object địa chỉ hợp lệ hoặc mảng chứa object đầu tiên'
                    });
                }

                const requiredAddrFields = ['province', 'district', 'ward', 'detailAddress'];
                for (const f of requiredAddrFields) {
                    if (!addrObj[f] || typeof addrObj[f] !== 'string' || addrObj[f].trim() === '') {
                        return res.status(400).json({
                            error: 'Invalid address field',
                            message: `Trường địa chỉ "${f}" là bắt buộc và phải là chuỗi không rỗng`
                        });
                    }
                }

                // Chuẩn hóa địa chỉ mới để áp dụng
                newAddressToApply = {
                    province: addrObj.province.trim(),
                    district: addrObj.district.trim(),
                    ward: addrObj.ward.trim(),
                    detailAddress: addrObj.detailAddress.trim()
                };
            }

            // Kiểm tra customer tồn tại
            const existingCustomer = await Customer.findOne({ phone });
            if (!existingCustomer) {
                return res.status(404).json({
                    error: 'Customer not found',
                    message: 'Không tìm thấy khách hàng'
                });
            }

            // Chuẩn bị dữ liệu update
            const setData = { ...sanitizedUpdate };
            if (newAddressToApply) {
                // Lấy customer hiện tại để thay thế phần tử đầu trong addresses
                const currentAddresses = Array.isArray(existingCustomer.addresses)
                    ? existingCustomer.addresses
                    : [];
                const replaced = [newAddressToApply, ...currentAddresses.slice(1)];
                setData.addresses = replaced;
            }

            // Update customer
            const updatedCustomer = await Customer.findOneAndUpdate(
                { phone },
                { $set: setData },
                { new: true, runValidators: true }
            ).select('-password -__v -deleted -createdBy -updatedBy -deletedBy').lean();

            // Map address IDs to names for response
            const mappedAddresses = await mapAddressesWithLocationNames(updatedCustomer.addresses);

            res.status(200).json({
                message: 'Cập nhật thông tin thành công',
                customer: { ...updatedCustomer, addresses: mappedAddresses }
            });

        } catch (err) {
            console.error('Customer update error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Lỗi hệ thống, vui lòng thử lại'
            });
        }
    }
}

module.exports=customerController;