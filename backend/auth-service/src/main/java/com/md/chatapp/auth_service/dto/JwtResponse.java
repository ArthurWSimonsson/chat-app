package com.md.chatapp.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data 
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private List<String> roles;
    private String email;
}
