import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database using the URI from environment variables.
 */
const connectDB = async (): Promise<void> => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error("FATAL ERROR: MONGO_URI is not defined in the environment variables.");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

export default connectDB;
