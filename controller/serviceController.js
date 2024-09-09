const Service= require('../model/service.model')

const serviceController={
    getAll : async (req,res,next)=>{
        await Service.find()
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    },
    getOneByTitle:async (req,res,next)=>{
        await  Service.findOne({title:req.params.title})
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={serviceController};