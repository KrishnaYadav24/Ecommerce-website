package com.jspider.ecommerce.controler;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.LoginRequestDTO;
import com.jspider.ecommerce.dto.LoginResponseDto;
import com.jspider.ecommerce.service.LoginService;

import org.springframework.web.bind.annotation.RequestBody;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
public class LoginController {
	
	private final LoginService loginservice;
	
	@PostMapping("/login")
	public LoginResponseDto login(@RequestBody LoginRequestDTO request)	{
		return loginservice.login(request);
	}

}
