const Policy = require("../model/policy.model");
const policyController = {
    //GET all policies
    getAll: async (req, res, next) => {
        try {
            const policies = await Policy.find({status: "active"})
                .select("-_id -createdAt -updatedAt -status -__v -deleted -deletedAt -updatedBy");
            res.status(200).json(policies);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = policyController;