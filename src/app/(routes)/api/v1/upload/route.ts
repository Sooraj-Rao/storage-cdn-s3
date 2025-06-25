import { getApiKeyError, validateApiKey } from "@/app/lib/api-auth";
import { connectToDatabase, FileRecord } from "@/app/lib/db";
import { uploadFileToS3 } from "@/app/lib/s3";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return getApiKeyError();
    }

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";
    const accessType = (formData.get("accessType") as string) || "public";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    if (!["private", "public"].includes(accessType)) {
      return NextResponse.json(
        { error: "Access type must be 'private' or 'public'" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sanitizedFolder = folder
      .replace(/[^a-zA-Z0-9-_/]/g, "")
      .replace(/\/+/g, "/");
    const fileKey = `${sanitizedFolder}/${uuidv4()}-${file.name}`;

    const s3Key = await uploadFileToS3(buffer, fileKey, file.type);

    const publicId = accessType === "public" ? uuidv4() : null;

    const fileRecord = new FileRecord({
      filename: file.name,
      s3Key,
      contentType: file.type,
      size: file.size,
      accessType,
      publicId,
      folderName: sanitizedFolder,
    });

    await fileRecord.save();

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const fileUrl =
      accessType === "public" && publicId
        ? `${baseUrl}/api/files/${publicId}`
        : `${baseUrl}/api/files/${fileRecord._id}`;

    return NextResponse.json({
      success: true,
      fileId: fileRecord._id,
      fileUrl,
      filename: file.name,
      size: file.size,
      contentType: file.type,
      accessType,
      folder: sanitizedFolder,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
