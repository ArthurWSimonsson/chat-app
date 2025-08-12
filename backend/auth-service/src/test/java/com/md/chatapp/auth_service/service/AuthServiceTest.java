package com.md.chatapp.auth_service.service;

import com.md.chatapp.auth_service.model.User;
import com.md.chatapp.auth_service.dto.RegisterRequest;
import com.md.chatapp.auth_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the AuthService.
 *
 * Note: This test assumes you have the following classes:
 * - AuthService: The service being tested.
 * - AppUser: Your user entity.
 * - UserRepository: Your JPA repository for AppUser.
 * - RegisterRequest: A DTO for registration data.
 * - A custom exception like UserAlreadyExistsException.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
    }

    @Test
    void whenRegisterNewUser_thenSucceeds() {
        // Arrange: Mock the repository to indicate the user does not exist.
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        // Arrange: Mock the password encoder.
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        // Arrange: Mock the save operation to return the saved user.
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L); // Simulate saving and getting an ID.
            return user;
        });

        // Act: Call the method to be tested.
        User savedUser = authService.registerUser(registerRequest);

        // Assert: Verify the results.
        assertNotNull(savedUser);
        assertEquals("testuser", savedUser.getUsername());
        assertEquals("encodedPassword", savedUser.getPassword());

        // Verify that the save method was called exactly once.
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void whenRegisterExistingUser_thenThrowsException() {
        // Arrange: Mock the repository to indicate the username already exists.
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(new User()));

        // Act & Assert: Expect an exception to be thrown.
        assertThrows(RuntimeException.class, () -> authService.registerUser(registerRequest), "Expected registerUser to throw, but it didn't");
    }
}