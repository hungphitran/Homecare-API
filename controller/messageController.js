// Message controller disabled - OTP/ZNS functionality removed

const messageController = {
    // These functions are no longer available
    send: (req, res) => {
        res.status(501).json({
            error: 'Service not implemented',
            message: 'OTP/ZNS messaging service has been removed'
        });
    },
    
    get: (req, res) => {
        res.status(501).json({
            error: 'Service not implemented', 
            message: 'OTP/ZNS messaging service has been removed'
        });
    }
};

module.exports = messageController;
