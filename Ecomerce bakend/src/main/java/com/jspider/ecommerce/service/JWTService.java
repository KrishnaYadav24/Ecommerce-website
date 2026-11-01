package com.jspider.ecommerce.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JWTService {

    private final SecretKey secretKey =
        Keys.hmacShaKeyFor(
            "my-super-secret-key-for-ecommerce-jwt-2026-very-long"
                .getBytes(StandardCharsets.UTF_8)
        );

    public String generateToken(Authentication authentication) {

        UserDetails userDetails =
            (UserDetails) authentication.getPrincipal();

        String role = userDetails.getAuthorities()
                .iterator()
                .next()
                .getAuthority();

        return Jwts.builder()
                .subject(authentication.getName())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(
                    new Date(System.currentTimeMillis() + 1000 * 60 * 30)
                )
                .signWith(secretKey)
                .compact();
    }

    public String extractUserName(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(
            String token,
            UserDetails userDetails) {

        String userName = extractUserName(token);

        return userName.equals(userDetails.getUsername());
    }
}