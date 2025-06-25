import { isAdminAuthenticated } from "@/app/lib/admin-auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const isAuthenticated = await isAdminAuthenticated()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ success: true, authenticated: true })
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}
