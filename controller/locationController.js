const Location= require('../model/location')

const locationController={
    getLocation : async (req,res,next)=>{
        await Location.find({deleted:false})
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    }

    
}

module.exports={locationController};