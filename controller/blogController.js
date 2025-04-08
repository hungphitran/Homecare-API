const Blog= require('../model/blog.model')

const blogController={
    //return all blogs
    getAll : async (req,res,next)=>{
        await Blog.find({"status":"active"})
        .select("-deleted -createdBy -updatedBy -deletedAt -status")
        .sort({date:-1})
        .then((data)=> res.status(200).json(data))
        .catch((err)=>res.status(500).send(err))
    },
    getOne: async (req,res,next)=>{
        await Blog.findOne({"_id":req.params.id})
        .then(data=>res.status(200).json(data))
        .catch(err=>res.status(500).send(err))
    }
}

module.exports=blogController;