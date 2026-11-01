package com.jspider.ecommerce.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.UserRequestDTO;
import com.jspider.ecommerce.dto.UserResponseDTO;
import com.jspider.ecommerce.service.UserService;

import jakarta.validation.Valid;

@RestController
public class UserController {
	
	private final UserService userservice;

	
	public UserController(UserService userservice) {
		this.userservice = userservice;
	}
	
	@PostMapping("/registeruser")
	public UserResponseDTO registerUserService(@Valid  @RequestBody UserRequestDTO dto) {
		return userservice.registerUserService(dto);
	}
	
	@GetMapping("/displayuser/{id}")
	public UserResponseDTO getUserById(@PathVariable int id){
		return userservice.getUserById(id);
	}
	
	
	@PutMapping("/updateuser/{id}")
	public UserResponseDTO updateUserById(@PathVariable int id,@Valid  @RequestBody UserRequestDTO request) {
		return userservice.updateUserById(request, id);
	}
	
	@GetMapping("/users/me")
	public UserResponseDTO getCurrentUser() {
	    return userservice.getCurrentUser();
	}
	
	

}
