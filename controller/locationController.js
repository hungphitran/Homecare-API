const Location= require('../model/location')

const locationController={
    get : async (req,res,next)=>{
        await Location.find({deleted:{$nin:true}})
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }
}

module.exports={locationController};