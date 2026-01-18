// src/lambda.js
import serverless from "serverless-http";
import app from "./app.js";
import { dbconnect } from "./config/db.js";

let isDbConnected = false;

export const handler = serverless(app, {
  async request(req, event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    if (!isDbConnected) {
      await dbconnect();
      isDbConnected = true;
      console.log("DB connected (Lambda cold start)");
    }
  }
});

