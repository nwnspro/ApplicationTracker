const errorHandler = (err, req, res, next) => {
  // Log error with context for debugging
  console.error("Error occurred:", {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = 500;
  let message = "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err.name === "UnauthorizedError" || err.status === 401) {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.name === "ForbiddenError" || err.status === 403) {
    statusCode = 403;
    message = "Forbidden";
  } else if (err.name === "NotFoundError" || err.status === 404) {
    statusCode = 404;
    message = "Not Found";
  } else if (err.name === "ConflictError" || err.status === 409) {
    statusCode = 409;
    message = err.message || "Conflict";
  }

  // Build error response
  const response = {
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // Include additional details in development
  if (process.env.NODE_ENV === "development") {
    response.error.details = {
      name: err.name,
      stack: err.stack,
    };
  }

  res.status(statusCode).json(response);
};

export { errorHandler };
