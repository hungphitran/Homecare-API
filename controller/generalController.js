const generalModel = require("../model/generalSetting.model")

const generalController = {
    getAll: async (req, res) => {
        try {
            const generalSetting = await generalModel.findOne()
                .select('-_id -__v -baseSalary -createdAt -updatedAt');
            
            if (!generalSetting) {
                return res.status(404).json({ error: 'General settings not found' });
            }
            
            res.status(200).json(generalSetting);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
}

module.exports = generalController;