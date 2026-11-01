package com.jspider.ecommerce.service;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.UserRequestDTO;
import com.jspider.ecommerce.dto.UserResponseDTO;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.exception.UserAlreadyExistException;
import com.jspider.ecommerce.exception.UserNotFoundException;
import com.jspider.ecommerce.mapper.UserMapper;
import com.jspider.ecommerce.repository.UserRepository;

@Service
public class UserService {

	
	private final UserRepository repository;
	private final UserMapper usermapper ;
	private final PasswordEncoder passwordEncoder;
	
	public UserService(UserRepository repository, UserMapper usermapper,PasswordEncoder passwordEncoder) {
		super();
		this.repository = repository;
		this.usermapper = usermapper;
		this.passwordEncoder = passwordEncoder;
	}
	
	public UserResponseDTO registerUserService(UserRequestDTO dto) {
		
		boolean userExist = repository.existsByEmail(dto.getEmail());
		
		if(userExist) {
			throw new UserAlreadyExistException("User with email " + dto.getEmail() + " already exists");
		}
		
		User user = usermapper.toEntity(dto);
		user.setPassword(
			    passwordEncoder.encode(user.getPassword())
			);
		user.setRole("USER");
		User saveduser = repository.save(user);
		
		return usermapper.toResponseDTO(saveduser);
		
	}
	
	public UserResponseDTO getUserById(int id){
		
		Optional<User> user = repository.findById(id);
		if(user.isPresent()) {
			
			User users = user.get();
			return usermapper.toResponseDTO(users);
		}
		
		throw new UserNotFoundException("user with this id" +id+ "does not exist");
	}
	
	public UserResponseDTO updateUserById(UserRequestDTO request,int id) {
		
		Optional<User> optional = repository.findById(id);
		if(optional.isEmpty()) {
			throw new UserNotFoundException("User not found with id" +id);
		}
		
		User user = optional.get();
		
		 if (!user.getEmail().equals(request.getEmail())) {

		        boolean emailExist = repository.existsByEmail(request.getEmail());

		        if (emailExist) {
		            throw new UserAlreadyExistException(
		                    "User with email " + request.getEmail() + " already exists"
		            );
		        }
		    }
		
		
		usermapper.updateEntity(request, user);
		User saveUser = repository.save(user);
		return usermapper.toResponseDTO(saveUser);
		
	}
	
	public UserResponseDTO getCurrentUser() {
		
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		
		String email = authentication.getName();
		
		User user = repository.findByEmail(email);
		
		if(user == null) {
			  throw new UserNotFoundException(
			            "User with email " + email + " does not exist"
			        );
		}
		
		return usermapper.toResponseDTO(user);
		
	}
	
	

}
