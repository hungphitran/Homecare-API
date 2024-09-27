const Location= require('../model/location.model')

const locationController={
    getLocation : async (req,res,next)=>{
        await Location.find()
        .then(()=> {
            res.status(200).json("success")
        })
        .catch((err)=>{console.error(err)})
    }

    
}

module.exports={locationController};