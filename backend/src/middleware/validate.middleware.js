const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');


//  Middleware to check express-validator results
//  Must be placed AFTER the validation chain in route definitions

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return ApiResponse.validationError(res, formattedErrors);
  }

  next();
};

module.exports = { validate };
