export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function createNotFoundError(message = 'Route not found') {
  return new AppError(message, 404);
}

export function createValidationError(message, details = null) {
  return new AppError(message, 400, details);
}
