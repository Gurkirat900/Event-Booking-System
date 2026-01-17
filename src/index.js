import app from "./app.js";
import { dbconnect } from "./config/db.js";


const PORT=process.env.PORT || 5000

dbconnect().then(()=>{
    app.listen(PORT,()=>{
        console.log('Server running on port- ',PORT);
    })
})
.catch((error)=>{
    console.log("Error running in server. Connection to db failed",error)
})








    

