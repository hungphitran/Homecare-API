const Staff= require('../model/staff.model')

const staffController={
    getAll : async (req,res,next)=>{
        await Staff.find()
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    },

    getWithFilter: async(req,res,next)=>{
        res.send(req.params);
//        await Helper.findOne({_id:req.params.id})
//        .then(data=> {
//            res.status(200).json(data)
//        })
//        .catch((err)=>{console.error(err)})
    }
}

module.exports={staffController};