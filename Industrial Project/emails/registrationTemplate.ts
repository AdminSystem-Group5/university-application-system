export function registrationEmailTemplate(name: string): string {
  return `
    <div style="font-family: Arial; line-height: 1.6;">
      <h2>Welcome to the System</h2>
      <p>Hello ${name},</p>
      <p>Your account has been successfully created.</p>
      <p>You can now access the platform.</p>
      <br/>
      <p>Regards,<br/>System Team</p>
    </div>
  `;
}