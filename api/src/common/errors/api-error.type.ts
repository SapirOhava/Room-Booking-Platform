export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type ApiErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  path: string;
  timestamp: string;
};
