const Service= require('../model/service.model')

const serviceController={
    getAll : async (req,res,next)=>{
        await Service.find()
        .then(()=> res.status(200).json("success"))
        .catch((err)=>{console.error(err)})
    },
    getOneById:async (req,res,next)=>{
        await  Service.findOne({_id:req.params.id})
        .then(()=> {
            res.status(200).json("success")
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={serviceController};