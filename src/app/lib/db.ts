/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

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
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accessType: {
    type: String,
    enum: ["private", "public", "passkey"],
    default: "private",
    required: true,
  },
  passkey: {
    type: String,
    default: null,
  },
  publicId: {
    type: String,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})



export const User = mongoose.models.User || mongoose.model("User", userSchema)
export const FileRecord = mongoose.models.FileRecord || mongoose.model("FileRecord", fileSchema)

export interface IUser extends mongoose.Document {
  _id: string
  email: string
  passwordHash: string
  createdAt: Date
}

export interface IFileRecord extends mongoose.Document {
  _id: string
  filename: string
  s3Key: string
  contentType: string
  size: number
  userId: string
  accessType: "private" | "public" | "passkey"
  passkey?: string
  publicId?: string
  uploadedAt: Date
}
