const generalModel = require("../model/general.model")


const generalController = {
    getAll: async (req, res) => {
        try {
            const generalSettings = await generalModel.find();
            res.json(generalSettings);
        } catch (error) {
            res.json({ message: error });
        }
    },
}

module.exports = generalController;