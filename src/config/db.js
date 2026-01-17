import mysql from 'mysql2/promise';
import { ApiError } from '../utils/ApiError.js';

let db;   // connection instance=> queries will be called on this

const dbconnect= async ()=> {                     // connection fn called in index.js
    try {
        if(!db){
            db= mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 3,         // VERY IMPORTANT (Lambda safe)
            queueLimit: 0
        })
        }
        console.log("Connected to MySQL: Success!!");
        return db;
    } catch (error) {
        console.log("ERROR! MySQL connection failed",error)
    }
}

const getDB= ()=>{
    if(!db){
        throw new ApiError(500,"Databse pool db not created")
    }
    return db;
}


export {dbconnect,getDB};