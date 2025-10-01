import dotenv from "dotenv";
import app from './app';
import connectDB from './database/mongodb';

// Load environment variables from .env file
dotenv.config();

// Express app
import app from "./app";

// Connect to the MongoDB database
connectDB();

// Start server
const port = config.PORT || 5052;
// Start the Express server
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Access the server at http://localhost:${PORT}`);
});

// Graceful shutdown for unhandled promise rejections
process.on("unhandledRejection", (err: unknown) => {
  if (err instanceof Error) {
    console.error("UNHANDLED REJECTION 🔥:", err.name, err.message);
  } else {
    console.error("UNHANDLED REJECTION 🔥:", err);
  }

  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions (synchronous code errors)
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION 🔥:", err.name, err.message);
  process.exit(1);
});

// Graceful shutdown logic
const gracefulShutdown = async (signal: string) => {
  console.log(`👋 ${signal} received. Closing server gracefully...`);
  await prisma.$disconnect();
  server.close(() => {
    console.log("💥 Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // System termination
