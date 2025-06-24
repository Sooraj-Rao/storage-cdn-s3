import { clearAuthCookie } from "@/app/lib/auth"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await clearAuthCookie()
    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
