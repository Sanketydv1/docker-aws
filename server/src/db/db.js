import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`MongoBD Connected !!`)
    } catch (error) {
        console.log('MongoDB connection Failed', error)
        throw error
    }
}

export default connectDB;
