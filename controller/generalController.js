const generalModel = require("../model/general.model")


const generalController = {
    getAll: async (req, res) => {
        try {
            const generalSetting = await generalModel.findOne()
            .select('-_id -__v -baseSalary -createdAt -updatedAt')
            res.status(200).json(generalSetting);
        } catch (error) {
            res.status(500).json(error);
        }
    },
}

module.exports = generalController;