const timeOff= require('../model/timeOff.model');

const timeOffController={
    //return all timeOffs of an helper
    getAll: async (req,res,next)=>{
        await timeOff.find({"_id":req.params.id ,status: "approved"})
        .select('-createdBy -_id -__v -deletedAt -status')
        .then(data=>res.status(200).json(data))
        .catch(err=>res.status(500).send(err))
    },
    test: async (req,res,next)=>{
        await timeOff.find({})
        .then(data=>res.status(200).json(data))
        .catch(err=>res.status(500).send(err))
    }
}

module.exports=timeOffController;