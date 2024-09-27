const Helper= require('../model/helper.model')

const helperController={
    //return all helpers
    getAll : async (req,res,next)=>{
        await Helper.find()
        .then(()=> res.status(200).json("success"))
        .catch((err)=>{console.error(err)})
    },
    // return only one helper
    getOneById: async (req,res,next)=>{
        await Helper.findOne({_id:req.params.id})
            .then(()=>res.status(200).json("success"))
            .catch((err)=>{console.error(err)})
    }
}

module.exports={helperController};