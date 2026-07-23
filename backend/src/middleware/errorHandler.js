const statusMessages = {
  400: "Bad request",
  401: "Unauthorized",
  404: "Not found",
  409: "Conflict",
  423: "Account locked",
  429: "Too many requests",
  500: "Internal server error",
};

export function notFound(req, res, next) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Log full error details server-side for debugging
  if (statusCode >= 500) {
    console.error(err);
  } else {
    console.warn(`[${statusCode}] ${err.message}`);
  }

  const message = statusMessages[statusCode];

  res.status(statusCode).json({ message });
}
