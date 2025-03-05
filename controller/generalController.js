const generalModel = require("../model/general.model")


const generalController = {
    getAll: async (req, res) => {
        try {
            const generalSettings = await generalModel.find();
            res.status(200).json(generalSettings[0]);
        } catch (error) {
            res.status(500).json(error);
        }
    },
}

module.exports = generalController;