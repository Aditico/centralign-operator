
const TRANSIENT_ERROR_PATTERNS = [
  /timeout/i,
  /temporarily unavailable/i,
  /connection reset/i,
  /rate limit/i,
];

const MAX_ATTEMPTS = 2;

export function shouldRetry(error, attempt) {
  if (
    !error?.message ||
    !Number.isInteger(attempt) ||
    attempt < 1 ||
    attempt >= MAX_ATTEMPTS
  ) {
    return false;
  }

  // Never retry input or validation errors.
  if (/validation|required|invalid input|invoice text is required/i.test(
    error.message
  )) {
    return false;
  }

  return TRANSIENT_ERROR_PATTERNS.some((pattern) =>
    pattern.test(error.message)
  );
}
