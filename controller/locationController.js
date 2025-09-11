const Location= require('../model/location.model')

const locationController={
    getLocation : async (req,res,next)=>{
        try {
            const data = await Location.find()
                .select('-_id -wards._id');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        } 
    }
}

module.exports=locationController;