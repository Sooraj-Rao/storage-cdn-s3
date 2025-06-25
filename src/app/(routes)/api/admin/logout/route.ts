import { clearAdminCookie } from "@/app/lib/admin-auth"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await clearAdminCookie()
    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Admin logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
