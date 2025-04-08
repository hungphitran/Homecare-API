const RequestDetail = require('../model/requestDetail.model')
const GeneralSetting = require('../model/general.model')
const moment = require("moment");
const mongoose = require('mongoose')



const requestDetailController ={
    getByIds: async (req,res,next)=>{
        //separate query to ids list
        let ids=req.query.ids.split(',')
        //get all the requests which id in ids
        await RequestDetail.find({'_id':{$in : ids}})
        .select('-__v -createdAt -updatedAt -deletedAt')
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
    getByHelperId: async (req,res,next)=>{
        await RequestDetail.find({helper_id:req.params.id})
        .select('-__v -createdAt -updatedAt -deletedAt')
        .sort({ workingDate: -1 })// sort by working date
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },    
    //update the request detail with the review
    postReview: async (req,res,next)=>{
        //update the request detail with the review
        console.log(req.body)
        await RequestDetail.findByIdAndUpdate(req.body.detailId,{
            $set:{
                'comment':req.body.comment,
            }
        })
        .then(data=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    }
}

module.exports = requestDetailController;