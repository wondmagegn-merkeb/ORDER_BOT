// Base Error Class with Advanced Features
class CustomError extends Error {
    constructor(message, statusCode, isOperational = true, additionalInfo = {}) {
      super(message);
      
      // Capture the stack trace (helps in debugging)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
  
      this.name = this.constructor.name;   // Dynamically set error name (e.g., CustomError)
      this.statusCode = statusCode || 500; // Default to 500 for server errors
      this.isOperational = isOperational; // Flag to mark operational errors (user-caused)
      this.additionalInfo = additionalInfo; // Extra info to pass (like error codes or tracking ids)
  
      // Optionally log the error (could be extended to log to a file or monitoring system)
      this.logError();
    }
  
    // Optional method to log errors to the console or external service
    logError() {
      if (!this.isOperational) {
        // Log only non-operational errors to track unexpected issues (e.g., crashes)
        console.error(`[${new Date().toISOString()}] ERROR: ${this.message}`, this.stack);
      }
    }
  }
  
  // Example: Not Found Error (404)
  class NotFoundError extends CustomError {
    constructor(message = 'Resource not found', additionalInfo = {}) {
      super(message, 404, true, additionalInfo);
    }
  }
  
  // Example: Validation Error (400)
  class ValidationError extends CustomError {
    constructor(message = 'Validation failed', additionalInfo = {}) {
      super(message, 400, true, additionalInfo);
    }
  }
  
  // Example: Internal Server Error (500)
  class InternalServerError extends CustomError {
    constructor(message = 'Internal server error', additionalInfo = {}) {
      super(message, 500, false, additionalInfo);
    }
  }
  
  // Example: Unauthorized Error (401)
  class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorized access', additionalInfo = {}) {
      super(message, 401, true, additionalInfo);
    }
  }
  
  // Example: Forbidden Error (403)
  class ForbiddenError extends CustomError {
    constructor(message = 'Forbidden', additionalInfo = {}) {
      super(message, 403, true, additionalInfo);
    }
  }
  
  // Example: Custom Conflict Error (409)
  class ConflictError extends CustomError {
    constructor(message = 'Conflict occurred', additionalInfo = {}) {
      super(message, 409, true, additionalInfo);
    }
  }
  
  module.exports = {
    CustomError,
    NotFoundError,
    ValidationError,
    InternalServerError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
  };
  