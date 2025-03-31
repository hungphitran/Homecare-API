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
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
    getByHelperId: async (req,res,next)=>{
        await RequestDetail.find({helper_id:req.params.id})
        .sort({ workingDate: -1 })
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },    
}

module.exports = requestDetailController;