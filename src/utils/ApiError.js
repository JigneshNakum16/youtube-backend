class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something want wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.error = errors;
    this.message = message;
    this.data = null;
    this.statusCode = statusCode;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
