import { generateToken, hashPassword, setAuthCookie } from "@/app/lib/auth"
import { connectToDatabase, User } from "@/app/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await connectToDatabase()

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
    })

    await user.save()

    const token = generateToken(user._id.toString())
    await setAuthCookie(token)

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: user._id.toString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
