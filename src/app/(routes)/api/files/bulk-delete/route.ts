import { getCurrentUser } from "@/app/lib/auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { deleteFileFromS3 } from "@/app/lib/s3"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileIds } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No file IDs provided" }, { status: 400 })
    }

    await connectToDatabase()

    const files = await FileRecord.find({
      _id: { $in: fileIds },
      userId: user._id,
    })

    if (files.length === 0) {
      return NextResponse.json({ error: "No files found or access denied" }, { status: 404 })
    }

    const deletionResults = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const file of files) {
      try {
        await deleteFileFromS3(file.s3Key)

        await FileRecord.findByIdAndDelete(file._id)

        deletionResults.successful++
      } catch (error) {
        console.error(`Failed to delete file ${file.filename}:`, error)
        deletionResults.failed++
        deletionResults.errors.push(`Failed to delete ${file.filename}`)
      }
    }

    return NextResponse.json({
      message: `Deleted ${deletionResults.successful} files successfully`,
      results: deletionResults,
    })
  } catch (error) {
    console.error("Bulk deletion error:", error)
    return NextResponse.json({ error: "Failed to delete files" }, { status: 500 })
  }
}
