package com.md.chatapp.auth_service.service;

import com.md.chatapp.auth_service.dto.LoginRequest;
import com.md.chatapp.auth_service.dto.RegisterRequest;
import com.md.chatapp.auth_service.model.Role; 
import com.md.chatapp.auth_service.model.User;
import com.md.chatapp.auth_service.repository.UserRepository;
import com.md.chatapp.auth_service.security.jwt.JwtUtils;

import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }


    @Transactional 
    public User registerUser(RegisterRequest registerRequest) {
        
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            
            throw new RuntimeException("Error: Username is already taken!");
            
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());

        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        user.getRoles().add(Role.ROLE_USER);

        return userRepository.save(user);
    }

    public String authenticateAndGenerateToken(LoginRequest loginRequest) {
        
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword());


        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);

        return jwt;
    }
}
