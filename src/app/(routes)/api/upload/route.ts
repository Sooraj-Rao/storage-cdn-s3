import { getApiKeyError, validateApiKey } from "@/app/lib/api-auth";
import { connectToDatabase, FileRecord } from "@/app/lib/db";
import { uploadFileToS3 } from "@/app/lib/s3";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 1 * 1024 * 1024;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.hostname.endsWith(".soorajrao.in") ;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return new NextResponse(
      JSON.stringify({ error: "CORS not allowed from this origin" }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "null",
        },
      }
    );
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    if (!validateApiKey(request)) {
      return getApiKeyError();
    }

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(
        JSON.stringify({
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileKey = `files/${uuidv4()}-${file.name}`;

    const s3Key = await uploadFileToS3(buffer, fileKey, file.type);

    const publicId = uuidv4();

    const fileRecord = new FileRecord({
      filename: file.name,
      s3Key,
      size: file.size,
      publicId,
    });

    await fileRecord.save();

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const fileUrl = `${baseUrl}/api/files/${publicId}`;

    return new NextResponse(
      JSON.stringify({
        success: true,
        fileId: fileRecord._id,
        fileUrl,
        filename: file.name,
        size: file.size,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new NextResponse(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        "Access-Control-Allow-Origin": "null",
      },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
