package com.jspider.ecommerce.service;


import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.LoginRequestDTO;
import com.jspider.ecommerce.dto.LoginResponseDto;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class LoginService {

	private final AuthenticationManager authenticationManager;
	private final JWTService jwt;

	public LoginResponseDto login(LoginRequestDTO request) {

		Authentication authentication = authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

		String token = jwt.generateToken(authentication);
		
		LoginResponseDto response = new LoginResponseDto();
		response.setMessage("Login successful");
		response.setToken(token);

		return response;
	}

}
