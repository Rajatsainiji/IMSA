
class ApiResponse {

  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

// Created response (201)

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

//  Error response

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

//  Validation error response (422)

  static validationError(res, errors, message = 'Validation failed') {
    return ApiResponse.error(res, message, 422, errors);
  }

//  Not Found response (404)

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

// Unauthorized response (401)

  static unauthorized(res, message = 'Unauthorized access') {
    return ApiResponse.error(res, message, 401);
  }

//  Forbidden response (403)

  static forbidden(res, message = 'Access forbidden') {
    return ApiResponse.error(res, message, 403);
  }

// Conflict response (409)

  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, 409);
  }

// Paginated response helper

  static paginated(res, data, pagination, message = 'Success') {
    const meta = {
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      }
    };
    return ApiResponse.success(res, data, message, 200, meta);
  }
}

module.exports = ApiResponse;
