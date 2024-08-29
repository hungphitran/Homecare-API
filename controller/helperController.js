const Helper= require('../model/helper.model')

const helperController={
    get : async (req,res,next)=>{
        await Helper.find()
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={helperController};