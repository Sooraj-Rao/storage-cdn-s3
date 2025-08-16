import { connectToDatabase, FileRecord } from "@/app/lib/db";
import { getFileFromS3 } from "@/app/lib/s3";
import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    let file = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      file = await FileRecord.findById(id);
    }

    if (!file) {
      file = await FileRecord.findOne({ publicId: id });
    }
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

   

    const { body, contentType, contentLength } = await getFileFromS3(
      file.s3Key
    );

    const headers = new Headers();
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    if (contentLength) {
      headers.set("Content-Length", contentLength.toString());
    }

    if (file.accessType === "public") {
      headers.set("Cache-Control", "public, max-age=31536000, immutable"); // 1  yr
    } else {
      headers.set("Cache-Control", "private, no-cache");
    }

    return new NextResponse(body, { headers });
  } catch (error) {
    console.error("File access error:", error);
    return NextResponse.json(
      { error: "Failed to access file" },
      { status: 500 }
    );
  }
}
