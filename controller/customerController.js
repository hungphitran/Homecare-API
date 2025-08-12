const Customer = require('../model/customer.model')
const bcrypt = require('bcrypt');

const customerController ={
    getOne: async(req,res,next)=>{
        Customer.findOne({phone:req.params.phone})
        .select('-password -__v -deleted -createdBy -updatedBy -deletedBy')
        .then((data)=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
    },
    getAll: async (req,res,next)=>{
        Customer.find({})
        .select('-password -__v -deleted -createdBy -updatedBy -deletedBy')
        .then((data)=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
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
            ).select('-password -__v -deleted -createdBy -updatedBy -deletedBy');

            res.status(200).json({
                message: 'Cập nhật thông tin thành công',
                customer: updatedCustomer
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