const costFactorType = require('../model/costFactorType.model');

const costFactorTypeController = {
    // GET all cost factors which are active
    getAll: async (req, res) => {
        await costFactorType.find({status: 'active'})
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    }
}

module.exports = costFactorTypeController;