const Question = require("../model/question.model");

const questionController = {
    //GET all questions
    getAll: async (req, res, next) => {
        await Question.find({status: "active"})
            .select('question answer -_id')
            .then((questions) => res.status(200).send(questions))
            .catch((err) => res.status(500).send(err));
    },
};

module.exports = questionController;