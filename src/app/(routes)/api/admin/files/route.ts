import { isAdminAuthenticated } from "@/app/lib/admin-auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const isAuthenticated = await isAdminAuthenticated()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectToDatabase()

    const files = await FileRecord.find({}).sort({ uploadedAt: -1 }).lean()

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error("Admin files fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}
