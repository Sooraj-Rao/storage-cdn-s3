import { getCurrentUser } from "@/app/lib/auth";
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
    const url = new URL(request.url);
    const passkey = url.searchParams.get("passkey");
    const isDownload = url.searchParams.get("download") === "true";

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

    if (file.accessType === "private") {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (file.userId.toString() !== user._id.toString()) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (file.accessType === "passkey") {
      if (!passkey || passkey !== file.passkey) {
        return NextResponse.json(
          { error: "Invalid or missing passkey" },
          { status: 401 }
        );
      }
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

    if (isDownload) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${file.filename}"`
      );
    } else {
      headers.set("Content-Disposition", `inline; filename="${file.filename}"`);
    }

    if (file.accessType === "public") {
      headers.set("Cache-Control", "public, max-age=3600");
    } else {
      headers.set("Cache-Control", "private, max-age=3600");
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
