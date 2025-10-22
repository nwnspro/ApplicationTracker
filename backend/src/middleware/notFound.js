const notFound = (req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
};

export { notFound };
