import { getCurrentUser } from "@/app/lib/auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { deleteFileFromS3 } from "@/app/lib/s3"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await connectToDatabase()

    const file = await FileRecord.findById(id)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (file.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    try {
      await deleteFileFromS3(file.s3Key)
    } catch (s3Error) {
      console.error("S3 deletion error:", s3Error)
    }

    await FileRecord.findByIdAndDelete(id)

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("File deletion error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
