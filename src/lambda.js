import serverless from "serverless-http";
import app from "./app.js";
import { dbconnect } from "./config/db.js";

let isDbConnected = false;

// Connect DB ONCE during cold start
const handler = serverless(app, {
  async request(request, event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    if (!isDbConnected) {
      await dbconnect();
      isDbConnected = true;
      console.log("DB connected (Lambda cold start)");
    }
  }
});

export { handler };
