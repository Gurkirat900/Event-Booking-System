import mysql from 'mysql2/promise';
import { ApiError } from '../utils/ApiError.js';

let db;   // connection instance=> queries will be called on this

const dbconnect= async ()=> {                     // connection fn called in index.js
    try {
        db= await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: 'Event_Booking_System'
        })
        console.log("Connected to MySQL: Success!");
        return db;
    } catch (error) {
        console.log("ERROR! MySQL connection failed",error)
    }
}

const getDB= ()=>{
    if(!db){
        throw new ApiError(500,"Databse instance db not created")
    }
    return db;
}


export {dbconnect,getDB};