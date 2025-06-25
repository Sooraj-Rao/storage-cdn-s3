/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getApiKeyError, validateApiKey } from "@/app/lib/api-auth";
import { connectToDatabase, FileRecord } from "@/app/lib/db";
import { deleteFileFromS3 } from "@/app/lib/s3";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateApiKey(request)) {
      return getApiKeyError();
    }

    const { id } = await params;
    await connectToDatabase();

    const file = await FileRecord.findById(id);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await deleteFileFromS3(file.s3Key);

    await FileRecord.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateApiKey(request)) {
      return getApiKeyError();
    }

    const { id } = await params;
    const { accessType } = await request.json();

    if (!["private", "public"].includes(accessType)) {
      return NextResponse.json(
        { error: "Access type must be 'private' or 'public'" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const file = await FileRecord.findById(id);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const updateData: any = { accessType };

    if (accessType === "public" && !file.publicId) {
      const { v4: uuidv4 } = require("uuid");
      updateData.publicId = uuidv4();
    } else if (accessType === "private") {
      updateData.publicId = null;
    }

    const updatedFile = await FileRecord.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const fileUrl =
      accessType === "public" && updatedFile.publicId
        ? `${baseUrl}/api/files/${updatedFile.publicId}`
        : `${baseUrl}/api/files/${updatedFile._id}`;

    return NextResponse.json({
      success: true,
      fileId: updatedFile._id,
      fileUrl,
      accessType: updatedFile.accessType,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
