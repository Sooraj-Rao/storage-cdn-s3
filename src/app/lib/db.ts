/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  
  s3Key: {
    type: String,
    required: true,
    unique: true,
  },
  publicId: {
    type: String,
    required: true,
    unique: true,
  },
  size: {
    type: Number,
    required: true,
  },

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export const FileRecord =
  mongoose.models.FileRecord || mongoose.model("FileRecord", fileSchema);

export interface IFileRecord extends mongoose.Document {
  _id: string;
  filename: string;
  s3Key: string;
  size: number;
  publicId:string,
  uploadedAt: Date;
}

export function validateAdminCredentials(
  email: string,
  password: string
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  return email === adminEmail && password === adminPassword;
}
