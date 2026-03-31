import { NextResponse } from "next/server";

type ApplicationPayload = {
  fullName?: string;
  email?: string;
  course?: string;
  status?: string;
};

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Applications API is working",
    data: [],
  });
}

export async function POST(request: Request) {
  try {
    const body: ApplicationPayload = await request.json();

    if (!body.fullName || !body.email || !body.course) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: fullName, email, or course",
        },
        { status: 400 }
      );
    }

    const application = {
      id: crypto.randomUUID(),
      fullName: body.fullName,
      email: body.email,
      course: body.course,
      status: body.status ?? "Submitted",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        data: application,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request body",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}