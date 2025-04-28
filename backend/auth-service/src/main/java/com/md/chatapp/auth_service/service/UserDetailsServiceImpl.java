package com.md.chatapp.auth_service.service;

import com.md.chatapp.auth_service.model.User;
import com.md.chatapp.auth_service.security.UserDetailsImpl;
import com.md.chatapp.auth_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Autowired
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true) 
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        //User user = userRepository.findByUsername(username)
        //        .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username));

        //Set<GrantedAuthority> authorities = user.getRoles().stream()
        //        .map(role -> new SimpleGrantedAuthority(role.name())) 
        //        .collect(Collectors.toSet());

        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail) // Pass the identifier for both checks
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username or email: " + usernameOrEmail));

        return new UserDetailsImpl(user);

        //return new org.springframework.security.core.userdetails.User(
        //        user.getUsername(),
        //        user.getPassword(),
        //        user.isEnabled(), 
        //        !user.isAccountExpired(), 
        //        !user.isCredentialsExpired(), 
        //        !user.isAccountLocked(),
        //        authorities);
    }
}