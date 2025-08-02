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

            // Validation: Không cho phép update các field quan trọng
            const restrictedFields = ['phone', 'password', 'signedUp'];
            restrictedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    delete updateData[field];
                }
            });

            // Validation email format nếu có
            if (updateData.email && updateData.email.trim() !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(updateData.email)) {
                    return res.status(400).json({
                        error: 'Invalid email format',
                        message: 'Email không đúng định dạng'
                    });
                }
            }

            // Validation fullName
            if (updateData.fullName && updateData.fullName.trim().length < 2) {
                return res.status(400).json({
                    error: 'Invalid fullName',
                    message: 'Tên phải có ít nhất 2 ký tự'
                });
            }

            // Kiểm tra customer tồn tại
            const existingCustomer = await Customer.findOne({ phone });
            if (!existingCustomer) {
                return res.status(404).json({
                    error: 'Customer not found',
                    message: 'Không tìm thấy khách hàng'
                });
            }

            // Update customer
            const updatedCustomer = await Customer.findOneAndUpdate(
                { phone },
                { $set: updateData },
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