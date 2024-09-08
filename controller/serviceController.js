const Service= require('../model/service.model')

const serviceController={
    get : async (req,res,next)=>{
        let filter={};
        if(req.query.title){
            filter={title:req.query.title}
        }
        await Service.find(filter)
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    },
//    getByTitle:async (req,res,next)=>{
//        await  Service.findOne({title:req.params.title})
//        .then(data=> {
//            res.status(200).json(data)
//        })
//        .catch((err)=>{console.error(err)})
//    }
}

module.exports={serviceController};