package com.md.chatapp.auth_service.controller;

import com.md.chatapp.auth_service.dto.ApiResponse;
import com.md.chatapp.auth_service.dto.JwtResponse;
import com.md.chatapp.auth_service.dto.LoginRequest;
import com.md.chatapp.auth_service.dto.RegisterRequest;
import com.md.chatapp.auth_service.security.UserDetailsImpl;
import com.md.chatapp.auth_service.service.AuthService;

import jakarta.validation.Valid;

import org.slf4j.Logger; 
import org.slf4j.LoggerFactory; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; 
import org.springframework.security.core.AuthenticationException; 
import org.springframework.security.core.context.SecurityContextHolder; 
import org.springframework.security.core.userdetails.UserDetails; 
import org.springframework.web.bind.annotation.*; 

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class); // Optional logger

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        logger.info("Attempting registration for user: {}", registerRequest.getUsername());
        //try {
            authService.registerUser(registerRequest);
            logger.info("User registered successfully: {}", registerRequest.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
        //} catch (RuntimeException e) {
        //    logger.error("Registration failed for user {}: {}", registerRequest.getUsername(), e.getMessage());
        //    return ResponseEntity
        //            .status(HttpStatus.BAD_REQUEST)
        //            .body(e.getMessage()); 
        //}
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
       
        logger.info("Attempting login for user: {}", loginRequest.getUsername());
        //try {
            String jwt = authService.authenticateAndGenerateToken(loginRequest);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.error("Authentication object not found in SecurityContext after successful token generation for {}", loginRequest.getUsername());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error retrieving user details after login."));
           }

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            // UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

             logger.info("User login successful: {}", loginRequest.getUsername());

            // Return the JWT and user details in the response body
            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    "Bearer", // Standard token type
                    userDetails.getId(), // TODO: Fetch User entity by username if ID is needed here
                    userDetails.getUsername(),
                    roles,
                    userDetails.getEmail()
            ));

      //  } catch (AuthenticationException e) {
      //       logger.error("Authentication failed for user {}: {}", loginRequest.getUsername(), e.getMessage());
      //      return ResponseEntity
      //              .status(HttpStatus.UNAUTHORIZED) // 401 Unauthorize
      //              .body(new ApiResponse(false, "Login failed: Invalid credentials")); // Use the DTO 
      //  } catch (Exception e) {
      //       logger.error("Unexpected login error for user {}: {}", loginRequest.getUsername(), e.getMessage(), e);
      //       return ResponseEntity
      //               .status(HttpStatus.INTERNAL_SERVER_ERROR)
      //               .body(new ApiResponse(false, "An internal error occurred during login."));
      //  }
    }
}