import express from "express"
import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"
import { dbconnect } from "./config/db.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import  userRoutes from './routers/userRouter.js';
import societyRoutes from "./routers/societyRouter.js";
import eventDraftRoutes from "./routers/eventDraftRouter.js"
import eventRegistrationRoutes from "./routers/eventRegisterRouter.js"
import eventRoutes from "./routers/eventsRouter.js"
import eventFeedbackroutes from "./routers/eventFeedbackRouter.js"

const app= express()

const allowedOrigins = [
  process.env.CORS_ORIGIN,     // prod frontend
  "http://localhost:3000",     // teammate’s React dev
  "http://localhost:5173"      // Vite dev server 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


// routes
app.use("/api/v1/users",userRoutes);
app.use("/api/v1/society",societyRoutes);
app.use("/api/v1/event-draft",eventDraftRoutes);
app.use("/api/v1/event",eventRoutes)
app.use("/api/v1/event-register",eventRegistrationRoutes);
app.use("/api/v1/event-feedback",eventFeedbackroutes);

app.use(errorHandler);


const PORT=process.env.PORT || 5000

dbconnect().then(()=>{
    app.listen(PORT,()=>{
        console.log('Server running on port- ',PORT);
    })
})
.catch((error)=>{
    console.log("Error running in server. Connection to db failed",error)
})








    

