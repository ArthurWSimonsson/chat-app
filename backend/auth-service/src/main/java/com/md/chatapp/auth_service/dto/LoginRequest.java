package com.md.chatapp.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Username or email cannot be blank")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    private String password;

    //@NotBlank(message = "Email cannot be blank")
    //@Email
    //@Size(max = 100, message = "Email cannot exceed 100 characters.")
    //private String email;
}