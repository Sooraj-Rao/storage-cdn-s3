/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isAdminAuthenticated } from "@/app/lib/admin-auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { deleteFileFromS3 } from "@/app/lib/s3"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAuthenticated = await isAdminAuthenticated()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const file = await FileRecord.findById(id)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await deleteFileFromS3(file.s3Key)

    await FileRecord.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    console.error("Admin delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAuthenticated = await isAdminAuthenticated()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const { accessType } = await request.json()

    if (!["private", "public"].includes(accessType)) {
      return NextResponse.json({ error: "Invalid access type" }, { status: 400 })
    }

    await connectToDatabase()

    const file = await FileRecord.findById(id)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const updateData: any = { accessType }

    if (accessType === "public" && !file.publicId) {
      const { v4: uuidv4 } = require("uuid")
      updateData.publicId = uuidv4()
    } else if (accessType === "private") {
      updateData.publicId = null
    }

    const updatedFile = await FileRecord.findByIdAndUpdate(id, updateData, { new: true })

    return NextResponse.json({
      success: true,
      accessType: updatedFile.accessType,
      publicId: updatedFile.publicId,
    })
  } catch (error) {
    console.error("Admin update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
