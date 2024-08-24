const Helper= require('../model/helper')

const helperController={
    get : async (req,res,next)=>{
        await Helper.find({deleted:false})
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={helperController};