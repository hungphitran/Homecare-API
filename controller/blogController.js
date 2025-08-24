const Blog= require('../model/blog.model')

const blogController={
    //return all blogs
    getAll : async (req,res,next)=>{
        try {
            const data = await Blog.find({"status":"active"})
                .select("-deleted -createdBy -updatedBy -deletedAt -status")
                .sort({date:-1});
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getOne: async (req,res,next)=>{
        try {
            const data = await Blog.findOne({"_id":req.params.id});
            if (!data) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports=blogController;