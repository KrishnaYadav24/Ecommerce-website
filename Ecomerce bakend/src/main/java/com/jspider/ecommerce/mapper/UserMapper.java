package com.jspider.ecommerce.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import com.jspider.ecommerce.dto.UserRequestDTO;
import com.jspider.ecommerce.dto.UserResponseDTO;
import com.jspider.ecommerce.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
	
	UserResponseDTO toResponseDTO(User user);
	User toEntity(UserRequestDTO request);
	
	void updateEntity(UserRequestDTO request, @MappingTarget User user);
	

}
