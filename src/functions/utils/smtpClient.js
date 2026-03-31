

export function sendEmailMock(payload) {
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