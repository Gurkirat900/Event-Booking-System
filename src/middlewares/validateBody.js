import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/* -----------------------------
   Define Zod schemas
--------------------------------*/
const schemas = {
  signup: z.object({
    name: z.string().min(3, "Name too short").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 chars"),
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password required"),
  }),

  joinSociety: z.object({
    join_code: z.string().min(4, "Invalid join code"),
  }),

  createSociety: z.object({
    name: z.string().min(3).max(100),
    join_code: z.string().min(4).max(20),
    description: z.string().max(500).optional(),
  }),

  assignPresident: z.object({
    societyId: z.number().int().positive().optional(),
    userId: z.number().int().positive(),
  }),

  registerEvent: z.object({
    eventId: z.number().int().positive(),
  }),

  unregisterEvent: z.object({
    eventId: z.number().int().positive(),
  }),

  submitReport: z.object({
    eventId: z.number().int().positive(),
    rating: z.number().min(1).max(5).optional(),
    comments: z.string().max(500).optional(),
  }),

  updateProfile: z.object({
    name: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
  }),

  changePass: z.object({
    oldpass: z.string().min(6, "Password must be at least 6 chars"),
    newpass: z.string().min(6, "Password must be at least 6 chars"),
  }),

  draftEvent: z.object({
    societyId: z.number().int().positive(),
    title: z.string().min(3, "Title too short").max(150),
    description: z.string(),
    proposedDate: z.string().optional(),
    proposedLocation: z.string().optional(),
    parentDraftId: z.number().int().positive().optional()
  }),

};

/* -----------------------------
   Validation Middleware
--------------------------------*/
export const validateBody = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new ApiError(500, `Zod schema '${schemaName}' not found`));
    }

    const parseResult = schema.safeParse(req.body);
    
    if (parseResult.success==false) {
      console.log("Zod errors=>",parseResult.error);
      throw new ApiError(400,"Invalid input")
      
    }

    // attach validated data (optional)
    req.body = parseResult.data;
    next();
  };
};
