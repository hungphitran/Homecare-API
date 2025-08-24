const Question = require("../model/question.model");

const questionController = {
    //GET all questions
    getAll: async (req, res, next) => {
        try {
            const questions = await Question.find({status: "active"})
                .select('question answer -_id');
            res.status(200).json(questions);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = questionController;