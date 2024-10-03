const Message = require('../model/authenmessage.model')
require('dotenv').config()
const https = require('https');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const sendSMS = function(phones,otp) {
    const url = process.env.SMS_SERVICE_URL;
    const params = JSON.stringify({
        to: phones,
        content: "Mã OTP của bạn trên HOMECARE là : "+otp,
        sms_type: 5,
        // sender: "Notify"
       sender: process.env.DEVICE_ID
    });

    const buf = Buffer.from(ACCESS_TOKEN + ':x');
    const auth = "Basic " + buf.toString('base64');
    const options = {
        hostname: url,
        port: 443,
        path: '/index.php/sms/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        }
    };

    const req = https.request(options, function(res) {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {
            let json = JSON.parse(body);
            console.log(body)
            if (json.status == 'success') {
                return true;
            }
            else {
                return false;
            }
        });
    });

    req.on('error', function(e) {
        return e;
    });

    req.write(params);
    req.end();
}




// Function to generate OTP 
function generateOTP() { 
  
    // Declare a digits constiable 
    // which stores all digits  
    let digits = '0123456789'; 
    let otp = ''; 
    let len = digits.length 
    for (let i = 0; i < 6; i++) { 
        otp += digits[Math.floor(Math.random() * len)]; 
    } 
     
    return otp; 
} 

const messageController={
    send: async (req,res,next)=>{
        const otp=generateOTP()
        console.log(req.body,otp)


        const tmp=sendSMS(req.body,otp)
        if(tmp){
            console.log('send sms success')
        }
        else{
            console.log('error in sending',tmp)
        }
        await Message.create({
            phone: req.body.phone,
            otp: otp,
            date:Date.now()
        }).then(()=> res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    },
    get:async (req,res,next)=>{
        if(!req.query.phone){
            res.status(500).json("error")
        }
        const mess=await Message.find({phone:req.query.phone})
        .then(data=>data[0])
        .catch(err=>res.status(500).json(err))

        if(mess){
            await Message.deleteOne({phone:req.query.phone})
        }

        res.status(200).json(mess)
    }
}

module.exports=messageController;