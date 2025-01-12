const GeneralSetting = require("../model/generalSetting.model")

const generalSettingController = {
    getAll: async (req, res, next) => {
        await GeneralSetting.find()
            .then((data) => res.status(200).json(data))
            .catch((err) => console.error(err))
    },
}

module.exports = generalSettingController;