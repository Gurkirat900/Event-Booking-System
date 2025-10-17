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
    societyCode: z.string().min(4, "Invalid join code"),
  }),

  createSociety: z.object({
    name: z.string().min(3).max(100),
    joinCode: z.string().min(4).max(20),
    description: z.string().max(500).optional(),
  }),

  assignPresident: z.object({
    societyId: z.number().int().positive(),
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
    phone: z.string().optional(),
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

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return next(new ApiError(400, errorMessages));
    }

    // attach validated data (optional)
    req.body = parseResult.data;
    next();
  };
};
