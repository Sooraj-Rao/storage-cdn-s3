/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser } from "@/app/lib/auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { uploadFileToS3 } from "@/app/lib/s3"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"


const MAX_FILE_SIZE = 10 * 1024 * 1024 

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const accessType = (formData.get("accessType") as string) || "private"
    const passkey = (formData.get("passkey") as string) || null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    if (!["private", "public", "passkey"].includes(accessType)) {
      return NextResponse.json({ error: "Invalid access type" }, { status: 400 })
    }

    if (accessType === "passkey" && (!passkey || passkey.length < 4)) {
      return NextResponse.json({ error: "Passkey must be at least 4 characters long" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const s3Key = await uploadFileToS3(buffer, file.name, file.type)

    await connectToDatabase()

    const fileData: any = {
      filename: file.name,
      s3Key,
      contentType: file.type,
      size: file.size,
      userId: user._id,
      accessType,
    }

    if (accessType === "passkey" && passkey) {
      fileData.passkey = passkey
    }

    if (accessType === "public" || accessType === "passkey") {
      fileData.publicId = uuidv4()
    }

    const fileRecord = new FileRecord(fileData)
    await fileRecord.save()

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        fileId: fileRecord._id.toString(),
        filename: file.name,
        accessType: fileRecord.accessType,
        publicId: fileRecord.publicId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
