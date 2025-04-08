const Location= require('../model/location.model')

const locationController={
    getLocation : async (req,res,next)=>{
        await Location.find()
        .select('-_id -Districts._id -Districts.Wards._id')
        .then((data)=> res.status(200).json(data))
        .catch((err)=>{console.error(err)})
    }

    
}

module.exports=locationController;