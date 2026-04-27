export function decisionTemplate(
  name,
  status
) {
  let message = "";

  if (status === "Offer") {
    message = "We are pleased to inform you that you have received an offer.";
  } else if (status === "Rejected") {
    message = "We regret to inform you that your application was not successful.";
  } else {
    message = "Your application is still under review.";
  }

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Application Update</h2>
      <p>Dear ${name},</p>
      <p>${message}</p>
      <p>Please log in to the platform for more details.</p>
      <p>Thank you.</p>
    </div>
  `;
}