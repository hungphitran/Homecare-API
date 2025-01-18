const Location= require('../model/location.model')

const locationController={
    getLocation : async (req,res,next)=>{
        await Location.find()
        .then((data)=> res.status(200).json(data))
        .catch((err)=>{console.error(err)})
    }

    
}

module.exports=locationController;