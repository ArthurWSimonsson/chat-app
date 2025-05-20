package com.md.chatapp.auth_service.controller;

import org.junit.jupiter.api.Test; // JUnit 5 test annotation
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc; // Configures MockMvc
import org.springframework.boot.test.context.SpringBootTest; // Loads full application context
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc; // Tool to perform mock HTTP requests
import org.springframework.transaction.annotation.Transactional;

import com.md.chatapp.auth_service.dto.LoginRequest;
// Import your DTOs
import com.md.chatapp.auth_service.dto.RegisterRequest;
// Import ObjectMapper to convert objects to JSON
import com.fasterxml.jackson.databind.ObjectMapper;

// Import MockMvc request builders and result matchers
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


// --- Annotations for the Test Class ---

// Loads the complete Spring application context (good for integration tests)
// MOCK environment uses MockMvc without starting a real web server
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
// Automatically configures the MockMvc instance for us to use
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    // Inject the MockMvc bean configured by @AutoConfigureMockMvc
    @Autowired
    private MockMvc mockMvc;

    // Inject ObjectMapper to easily convert our DTOs to JSON strings
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerUser_whenValidRequest_shouldReturnCreated() throws Exception {
        // 1. Arrange: Prepare the request data
        RegisterRequest registerRequest = new RegisterRequest();
        // Use a username guaranteed not to exist if your test reuses a DB
        // or configure test DB to be cleaned. Using unique names per test is safer.
        registerRequest.setUsername("testregisteruser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("placeholder@email.com");

        // Convert the request object to a JSON string
        String registerRequestJson = objectMapper.writeValueAsString(registerRequest);

        // 2. Act: Perform the mock HTTP POST request
        mockMvc.perform(post("/api/auth/register") // Target the registration endpoint
                        .contentType(MediaType.APPLICATION_JSON) // Set the content type header
                        .content(registerRequestJson)) // Set the JSON request body
                // 3. Assert: Check the expected response
                .andExpect(status().isCreated()) // Expect HTTP 201 Created status
                .andExpect(content().string("User registered successfully!")); // Expect the success message string in the body

        // TODO: Add assertion to check if user was actually saved in the database
        // This might require injecting the UserRepository and checking it,
        // or using a dedicated test database setup (H2, Testcontainers).
        // For now, we're just checking the controller's response.
    }

    @Test
    void loginUser_Success() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("db_test_user_01"); 
        loginRequest.setPassword("password123");
        //loginRequest.setEmail("placeholder_1@example.com");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk()) // Expect 200 OK
                .andExpect(jsonPath("$.token").exists()) // Check if token field exists
                .andExpect(jsonPath("$.token").isString()) // Check if token is a string
                .andExpect(jsonPath("$.username").value("db_test_user_01")) // Check username in response
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER")); // Check role in response
    }

    @Test
    void loginUser_BadCredentials() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("db_test_user_01"); // Use a known user
        loginRequest.setPassword("wrongpassword"); // Use incorrect password
        //loginRequest.setEmail("placeholder@email.com");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized()) // Expect 401 Unauthorized
                .andExpect(jsonPath("$.message").value("Authentication Failed: Bad credentials"));
    }

    @Test
    void loginUser_NotFound() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nosuchuser");
        loginRequest.setPassword("password123");
        //loginRequest.setEmail("placeholder@email.com");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                        .andExpect(status().isUnauthorized()); // Expect 401 Unauthorized
    }

}
