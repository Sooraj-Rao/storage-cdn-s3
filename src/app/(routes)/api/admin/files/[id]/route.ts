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


