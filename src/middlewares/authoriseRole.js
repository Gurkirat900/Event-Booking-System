import { ApiError } from "../utils/ApiError.js";

const authoriseRole= (...allowedroles)=>{
    return (req,res,next)=>{
        const userRole= req.user.role;     // from auth middleware
        if(!allowedroles.includes(userRole)){
            throw new ApiError(403,"Unauthorised request")
        }
        next();
    }
}

export {authoriseRole}