const Service= require('../model/service.model')

const serviceController={
    getAll : async (req,res,next)=>{
        await Service.find({status:"active"})
        .select('-__v -updatedBy -deletedBy -createdBy -createdAt -updatedAt -status -deleted')
        .then((data)=> res.status(200).json(data))
        .catch((err)=>{console.error(err)})
    },
    getOneById:async (req,res,next)=>{
        await  Service.findOne({_id:req.params.id})
        .select('-__v -updatedBy -deletedBy -createdBy -createdAt -updatedAt -status -deleted')
        .then((data)=>res.status(200).json(data))
        .catch((err)=>{console.error(err)})
    }
}
module.exports=serviceController;