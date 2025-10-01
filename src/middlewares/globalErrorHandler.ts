import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { catchAsync } from "../utils/catchAsync";


export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Fallback values
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  // Log for developers
  console.error("❌ Global Error:", err);

  // Only send meaningful message for known (operational) errors
  if (err instanceof AppError) {
    res.status(statusCode).json({
      status,  
      message: err.message,
    });
  }

  // Unknown error (e.g., programming bug)
  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};
