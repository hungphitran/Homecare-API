const Helper= require('../model/helper.model')
const Service = require('../model/service.model')
const mongoose = require('mongoose');

// Helper function to map jobs with service details
async function mapJobsWithServiceDetails(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
        return jobs || [];
    }
    
    try {
        // Get all services to create a lookup map
        const services = await Service.find({ deleted: false, status: 'active' })
            .select('title basicPrice description')
            .lean();
        
        // Create a map for quick lookup
        const serviceMap = new Map();
        services.forEach(service => {
            serviceMap.set(service.title, {
                title: service.title,
                basicPrice: service.basicPrice,
                description: service.description
            });
        });
        
        // Map jobs with service details
        return jobs.map(job => {
            // If job is just a string (service title), enhance it with service details
            if (typeof job === 'string') {
                const serviceDetail = serviceMap.get(job);
                return serviceDetail || { title: job, basicPrice: null, description: null };
            }
            
            // If job is already an object, enhance it if it has a title property
            if (typeof job === 'object' && job.title) {
                const serviceDetail = serviceMap.get(job.title);
                return {
                    ...job,
                    ...(serviceDetail || {})
                };
            }
            
            // Return job as-is if it doesn't match expected patterns
            return job;
        });
    } catch (error) {
        console.error('Error mapping jobs with service details:', error);
        return jobs; // Return original jobs if mapping fails
    }
}

const helperController={
    //return all helpers
    getAll : async (req,res,next)=>{
        try {
            const data = await Helper.find()
                .select('-password -baseFactor -__v -deleted -createdBy -updatedBy -deletedBy -createdAt -updatedAt')
                .lean();
            
            // Map jobs with service details for each helper
            const helpersWithMappedJobs = await Promise.all(
                data.map(async (helper) => {
                    const mappedJobs = await mapJobsWithServiceDetails(helper.jobs);
                    return {
                        ...helper,
                        jobs: mappedJobs
                    };
                })
            );
            
            res.status(200).json(helpersWithMappedJobs);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    // return only one helper
    getOneById: async (req,res,next)=>{
        try {
            console.log(req.params.id); 
            let id = req.params.id;
            
            // Validate ObjectId format but don't convert - let Mongoose handle it
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid helper ID format' });
            }
            
            const data = await Helper.findOne({_id: id})
                .select('-password -baseFactor -__v -deleted -createdBy -updatedBy -deletedBy -createdAt -updatedAt')
                .lean();
            
            if (!data) {
                return res.status(404).json({ error: 'Helper not found' });
            }
            
            // Map jobs with service details
            const mappedJobs = await mapJobsWithServiceDetails(data.jobs);
            const helperWithMappedJobs = {
                ...data,
                jobs: mappedJobs
            };
            
            res.status(200).json(helperWithMappedJobs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    // change the working status of the helper
    changeWorkingStatus: async (req,res,next)=>{
        try {
            if (!req.params.id) {
                return res.status(400).json({
                    error: 'Missing required parameter',
                    message: 'id là bắt buộc'
                });
            }
            if(req.user.role !== 'helper' || req.user.helper_id !== req.params.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Bạn chỉ có thể thay đổi trạng thái làm việc của chính mình'
                });
            }

            // Validate required fields
            if (!req.body.workingStatus) {
                return res.status(400).json({ 
                    error: 'Missing required field',
                    message: 'workingStatus là bắt buộc'
                });
            }
            const validStatuses = ['online', 'offline'];
            if (!validStatuses.includes(req.body.workingStatus)) {
                return res.status(400).json({ 
                    error: 'Invalid workingStatus value',
                    message: `workingStatus phải là một trong các giá trị sau: ${validStatuses.join(', ')}`
                });
            }
            
            // Find and update the helper

            const helper = await Helper.findById(req.params.id);
            if (!helper) {
                return res.status(404).json({ error: 'Helper not found' });
            }
            helper.workingStatus = req.body.workingStatus;
            await helper.save();
            res.status(200).json({ message: 'Working status updated successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }   
    },
}

module.exports=helperController;