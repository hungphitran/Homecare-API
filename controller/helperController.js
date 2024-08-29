const Helper= require('../model/helper.model')

const helperController={
    getAll : async (req,res,next)=>{
        await Helper.find()
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    },

    getById: async(req,res,next)=>{
        await Helper.findOne({_id:req.params.id})
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={helperController};