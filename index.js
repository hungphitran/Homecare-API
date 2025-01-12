const express=require('express')
const cors=require('cors')
const bodyParser = require('body-parser')
const db= require('./db/db')
const router =require('./routes/api')
require('dotenv').config()

const server = express();
server.use(cors());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
db.connect();
server.use('/', router);

server.listen(process.env.PORT||80,()=>{
  console.log('API-server is running on http://localhost')
})