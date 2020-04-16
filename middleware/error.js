const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  // log to console for the dev
  console.log(err.red);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Ressource not found`;
    error = new ErrorResponse(message, 404);
  }

  //MongoError
  if (err.name === "MongoError") {
    const message = err.errmsg;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose Duplicate Key (include in MongoError)
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation arror
  if (err.name === "Validation Error") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;
