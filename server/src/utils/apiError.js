const ApiError = (statusCode, message = "Something went wrong", errors = [], stack = "") => {

    const error = new Error(message);
    error.statusCode = statusCode;
    error.success = false;
    error.errors = errors;

    if (stack) {
        error.stack = stack
    } else {
        Error.captureStackTrace(error, ApiError)
    }

    return error

}

export { ApiError }