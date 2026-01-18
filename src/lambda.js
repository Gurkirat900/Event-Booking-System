import serverless from "serverless-http";
import app from "./app.js";
import { dbconnect } from "./config/db.js";

let isDbConnected = false;

export const handler = serverless(app, {
  request: async (req, event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    //  Ensure JSON body exists
    if (event.body && typeof event.body === "string") {
      try {
        req.body = JSON.parse(event.body);
      } catch {
        req.body = {};
      }
    }

    if (!isDbConnected) {
      await dbconnect();
      isDbConnected = true;
      console.log("DB connected (Lambda cold start)");
    }
  }
});

