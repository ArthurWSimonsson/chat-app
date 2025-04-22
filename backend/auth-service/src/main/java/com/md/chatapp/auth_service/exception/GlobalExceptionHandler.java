package com.md.chatapp.auth_service.exception;
import com.md.chatapp.auth_service.dto.ApiResponse;
// Import specific exceptions you might create later
// import com.yourcompany.chatapp.auth.exception.UsernameAlreadyExistsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException; // Handle general auth failures
import org.springframework.web.bind.MethodArgumentNotValidException; // Handle @Valid failures
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus; // Optional: Set status via annotation

import java.util.stream.Collectors;

@ControllerAdvice // Makes this class intercept exceptions from Controllers
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Handler for @Valid validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // Set status code directly
    public ResponseEntity<ApiResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Extract user-friendly error messages from validation results
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        logger.warn("Validation error: {}", errors);
        ApiResponse errorResponse = new ApiResponse(false, "Validation Failed: " + errors);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Handler for Authentication Exceptions (like BadCredentials)
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ApiResponse> handleAuthenticationException(AuthenticationException ex) {
        logger.warn("Authentication failed: {}", ex.getMessage());
        ApiResponse errorResponse = new ApiResponse(false, "Authentication Failed: " + ex.getMessage());
        // Avoid leaking too much detail in production messages for security
        // ApiResponse errorResponse = new ApiResponse(false, "Invalid credentials or authentication required");
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    // Example Handler for a specific custom exception (if you create one)
    // Replace RuntimeException with your specific exception (e.g., UsernameAlreadyExistsException)
    @ExceptionHandler(RuntimeException.class) // Catching Runtime temporarily, be more specific!
    public ResponseEntity<ApiResponse> handleUsernameExistsException(RuntimeException ex) {
        // Assuming this RuntimeException is thrown when username exists
        if (ex.getMessage() != null && ex.getMessage().contains("Username is already taken")) {
             logger.warn("Registration conflict: {}", ex.getMessage());
             ApiResponse errorResponse = new ApiResponse(false, ex.getMessage());
             return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT); // 409 Conflict is suitable
        }
        // If it's another RuntimeException, treat as internal server error
        return handleGenericException(ex);
    }


    // Generic handler for other unexpected exceptions
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ApiResponse> handleGenericException(Exception ex) {
        logger.error("An unexpected error occurred: {}", ex.getMessage(), ex); // Log the full stack trace for internal errors
        ApiResponse errorResponse = new ApiResponse(false, "An internal server error occurred. Please try again later.");
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}