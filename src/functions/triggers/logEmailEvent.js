export function logEmailEvent(type, email) {
  const logEntry = {
    type,
    email,
    timestamp: new Date().toISOString(),
  };

  console.log("[EMAIL LOG]", logEntry);

  return {
    success: true,
    logEntry,
  };
}