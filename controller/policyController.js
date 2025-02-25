const Policy = require("../model/policy.model");
const policyController = {
    //GET all policies
    getAll: async (req, res, next) => {
        await Policy.find()
            .then((policies) => res.status(200).send(policies))
            .catch((err) => res.status(500).send(err));
    },
};

module.exports = policyController;