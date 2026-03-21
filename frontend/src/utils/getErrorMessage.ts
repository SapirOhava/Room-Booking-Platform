export function getErrorMessage(error: any): string {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message[0];
  }

  if (typeof message === "string") {
    return message;
  }

  return "Something went wrong. Please try again.";
}
