import { ApiError } from "../utils/ApiError.js";


// Must be placed after all routes: app.use(errorHandler)
export const errorHandler = (err, req, res, next) => {
  console.error("Error caught by global handler:", err);

  // If it’s an instance of our custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  // If it’s a Zod error (in case we ever call schema.parse() instead of safeParse)
  if (err.name === "ZodError") {
    const formatted = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
    });
  }

  // Fallback for any other unexpected error
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
