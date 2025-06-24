/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { getCurrentUser } from "@/app/lib/auth";
import { connectToDatabase, FileRecord } from "@/app/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { accessType, passkey } = await request.json();

    if (!["private", "public", "passkey"].includes(accessType)) {
      return NextResponse.json(
        { error: "Invalid access type" },
        { status: 400 }
      );
    }

    if (accessType === "passkey" && (!passkey || passkey.length < 4)) {
      return NextResponse.json(
        { error: "Passkey must be at least 4 characters long" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const file = await FileRecord.findById(id);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: any = { accessType };

    if (accessType === "passkey") {
      updateData.passkey = passkey;
      if (!file.publicId) {
        const { v4: uuidv4 } = require("uuid");
        updateData.publicId = uuidv4();
      }
    } else if (accessType === "public") {
      updateData.passkey = null;
      if (!file.publicId) {
        const { v4: uuidv4 } = require("uuid");
        updateData.publicId = uuidv4();
      }
    }

    const updatedFile = await FileRecord.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({
      message: "Access settings updated successfully",
      accessType: updatedFile.accessType,
      publicId: updatedFile.publicId,
    });
  } catch (error) {
    console.error("Access update error:", error);
    return NextResponse.json(
      { error: "Failed to update access settings" },
      { status: 500 }
    );
  }
}
