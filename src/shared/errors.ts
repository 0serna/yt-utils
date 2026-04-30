export function createExtensionError(
  code: string,
  message: string,
  details?: unknown,
): Error & { code: string; details: unknown } {
  const error = new Error(message) as Error & {
    code: string;
    details: unknown;
  };
  error.code = code;
  error.details = details ?? null;
  return error;
}
