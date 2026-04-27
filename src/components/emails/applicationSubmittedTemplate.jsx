export function applicationSubmittedTemplate(name) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Application Submitted</h2>
      <p>Dear ${name},</p>
      <p>Your application has been successfully submitted.</p>
      <p>We will review it and notify you shortly.</p>
      <p>Regards,<br/>Admissions Team</p>
    </div>
  `;
}