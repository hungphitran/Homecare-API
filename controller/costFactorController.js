const costFactorType = require('../model/costFactorType.model');

const costFactorTypeController = {
    // GET all cost factors which are active
    getAll: async (req, res) => {
        try {
            const data = await costFactorType.find({status: 'active'})
                .select('-_id -__v -deleted -createdBy -updatedBy -deletedBy');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getService: async (req, res) => {
        try {
            const data = await costFactorType.find({status: 'active', applyTo: 'service'})
                .select('-_id -__v -deleted -createdBy -updatedBy -deletedBy');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getOther: async (req, res) => {
        try {
            const data = await costFactorType.find({status: 'active', applyTo: 'other'})
                .select('-_id -__v -deleted -createdBy -updatedBy -deletedBy');
            res.status(200).json(data[0]);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = costFactorTypeController;