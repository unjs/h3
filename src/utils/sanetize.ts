// Allowed characters: horizontal tabs, spaces or visible ascii characters: https://www.rfc-editor.org/rfc/rfc7230#section-3.1.2
// eslint-disable-next-line no-control-regex
const UNALLOWEED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;

export function sanetizeStatusMessage(statusMessage = ""): string {
  return statusMessage.replace(UNALLOWEED_STATUS_CHARS, "");
}

export function sanetizeStatusCode(
  statusCode: string | number = "",
  defaultStatusCode = 200
): number {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
