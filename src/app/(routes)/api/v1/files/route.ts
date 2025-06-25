/* eslint-disable @typescript-eslint/no-explicit-any */
import { getApiKeyError, validateApiKey } from "@/app/lib/api-auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { getFolderStructure, searchFiles } from "@/app/lib/folder-util"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return getApiKeyError()
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder")
    const search = searchParams.get("search")
    const app = searchParams.get("app")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const query: any = { userId: null } 

    if (app) {
      query["metadata.appName"] = app
    }

    if (folder) {
      query.s3Key = new RegExp(`^uploads/${folder}/`)
    }

    let files = await FileRecord.find(query).sort({ uploadedAt: -1 }).skip(offset).limit(limit).lean()

    if (search) {
      files = searchFiles(files, search)
    }

    const structure = getFolderStructure(files)

    const totalCount = await FileRecord.countDocuments(query)

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file._id,
        filename: file.filename,
        size: file.size,
        contentType: file.contentType,
        accessType: file.accessType,
        folder: file.metadata?.folderName || "root",
        app: file.metadata?.appName || "unknown",
        uploadedAt: file.uploadedAt,
        fileUrl: file.accessType === "private" ? `/api/files/${file._id}` : `/api/files/${file.publicId}`,
      })),
      folders: Object.values(structure.folders),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("API files list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
