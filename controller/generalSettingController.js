const { get } = require("mongoose");
const generalSettingModel = require("../model/generalSetting.model");

const generalSettingController = {
    get: async (req, res) => {
        await generalSettingModel.findOne()
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    },
}

module.exports = generalSettingController;