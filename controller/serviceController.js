const Service= require('../model/service.model')

const serviceController={
    getService : async (req,res,next)=>{
        await Service.find()
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={serviceController};