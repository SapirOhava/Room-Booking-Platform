import type { ApiErrorResponse } from "../types";

export function getErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: ApiErrorResponse } })?.response
    ?.data;

  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return "Something went wrong. Please try again.";
}

// explanation - Axios errors are wrapped like this:
// error = {
//   response: {
//     status: 400,
//     data: {
//       statusCode: 400,
//       code: "VALIDATION_ERROR",
//       message: "Validation failed",
//       details: [...]
//     }
//   }
// }

// response.data (Axios) = the whole JSON body from your API
