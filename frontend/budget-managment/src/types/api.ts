export interface ApiMessage {
  message: string;
}

export interface FastApiError {
  detail?: string | { msg?: string }[];
}
