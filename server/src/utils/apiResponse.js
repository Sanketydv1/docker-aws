const ApiResponse = (statusCode, data = null, message = "success") => {
    return {
        statusCode,
        data,
        message,
        success: statusCode < 400
    }
}
export { ApiResponse }