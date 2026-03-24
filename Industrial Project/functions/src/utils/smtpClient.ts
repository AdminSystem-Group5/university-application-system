type MockEmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export function sendEmailMock(payload: MockEmailPayload) {
  console.log("[SMTP MOCK] Sending email");
  console.log("To:", payload.to);
  console.log("Subject:", payload.subject);
  console.log("HTML:", payload.html);

  return {
    success: true,
    provider: "mock-smtp",
    message: "Email simulated successfully",
  };
}