import { NextResponse } from "next/server";

export async function GET() {
  const notifications = [
    {
      id: "1",
      type: "info",
      message: "Your application has been received.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      type: "status",
      message: "Your application status changed to Under Review.",
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json({
    success: true,
    data: notifications,
  });
}