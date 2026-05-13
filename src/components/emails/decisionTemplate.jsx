export function decisionTemplate(name, status, messageToStudent) {
  const studentName = escapeHtml(name || "Student");
  const applicationStatus = escapeHtml(status || "Under Review");
  const message = escapeHtml(messageToStudent || "");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #071126;">
      <h2>Application Status Update</h2>

      <p>Dear ${studentName},</p>

      <p>Your application status has been updated to:</p>

      <p>
        <strong>${applicationStatus}</strong>
      </p>

      ${
        message
          ? `<p>${message}</p>`
          : `<p>Please log in to the platform to view the latest update.</p>`
      }

      <p>Thank you.</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}