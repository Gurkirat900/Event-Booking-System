import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routers/userRouter.js";

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    console.log("CORS check start", origin);

    if (!origin) {
      console.log("No origin → allow");
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log("Origin allowed");
      return callback(null, true);
    }

    console.log("Origin NOT allowed → throwing error");
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});



export default app;
