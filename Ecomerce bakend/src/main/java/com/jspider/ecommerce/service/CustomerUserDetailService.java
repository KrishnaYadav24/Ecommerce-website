package com.jspider.ecommerce.service;

import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.exception.UserNotFoundException;
import com.jspider.ecommerce.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CustomerUserDetailService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {

        User user = userRepository.findByEmail(username);

        if (user == null) {
            throw new UserNotFoundException(
                "User with this email " + username + " does not exist"
            );
        }

        org.springframework.security.core.userdetails.User securityUser =
            new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole())
                )
            );

        return securityUser;
    }
}