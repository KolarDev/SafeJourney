import path from "path";
import express, { Application, Request, Response, ErrorRequestHandler } from "express";
import cors from "cors";
import bodyparser from "body-parser";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { AppError } from "./utils/appError";


// Import Routes
import authRoutes from "./routes/auth.route";
// import userRoutes from "./routes/user.route";


const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyparser.json());

// ROUTES

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hey there! from the sever side",
    app: "IntelliTest API",
  });
});

app.use('/api/v1/auth', authRoutes);

// Core Application Routes (Protected routes go here)
app.use('/api/v1/alerts', alertRoutes);

// Handle 404
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler as ErrorRequestHandler);


export default app;
