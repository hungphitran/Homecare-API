const Helper= require('../model/helper.model')

const helperController={
    get : async (req,res,next)=>{
        let filter={};
        if(req.query.id){
            filter={_id:req.query.id}
        }
        await Helper.find(filter)
        .then(data=> {
            res.status(200).json(data)
        })
        .catch((err)=>{console.error(err)})
    },
}

module.exports={helperController};