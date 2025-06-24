import { getCurrentUser } from "@/app/lib/auth"
import { connectToDatabase, FileRecord } from "@/app/lib/db"
import { NextResponse } from "next/server"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const files = await FileRecord.find({ userId: user._id }).sort({ uploadedAt: -1 }).lean()

    return NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
      },
      files,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
