const mongoose= require('mongoose')
require('dotenv').config()

function connect(){
    mongoose.connect(process.env.MONGO_URL)
    .then(()=>{console.log('connected to database')})
    .catch((err)=>{
        console.error(err);
    })
}

module.exports={connect}
