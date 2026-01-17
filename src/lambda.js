import serverless from "serverless-http";
import app from "./app.js";
import { dbconnect } from "./config/db.js";

let isDbConnected = false;

const connectDBOnce = async () => {
  if (!isDbConnected) {
    await dbconnect();
    isDbConnected = true;
    console.log("DB connected (Lambda cold start)");
  }
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop= false;   // to prevent lambda waiting for open db sockets to close
  await connectDBOnce();
  return await serverless(app)(event, context);     // lambda->handler->serverless->express
};

