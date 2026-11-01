
package com.jspider.ecommerce.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.RoleUpdateDTO;
import com.jspider.ecommerce.dto.UserResponseDTO;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.exception.UserNotFoundException;
import com.jspider.ecommerce.exception.InvalidRoleException;
import com.jspider.ecommerce.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public List<UserResponseDTO> getAllUsers() {

        List<User> users = userRepository.findAll();

        List<UserResponseDTO> responses = new ArrayList<>();

        for (User user : users) {

            UserResponseDTO response = new UserResponseDTO();

            response.setId(user.getId());
            response.setName(user.getName());
            response.setEmail(user.getEmail());
            response.setPhone(user.getPhone());

            responses.add(response);
        }

        return responses;
    }

    public UserResponseDTO getUserById(int id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found with id " + id));

        UserResponseDTO response = new UserResponseDTO();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());

        return response;
    }

    public UserResponseDTO updateUserRole(int id, RoleUpdateDTO request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User with id " + id + " does not exist"));

        String role = request.getRole().toUpperCase();

        if (!role.equals("USER") && !role.equals("ADMIN")) {
            throw new InvalidRoleException(
                    "Invalid role. Role must be USER or ADMIN");
        }

        user.setRole(role);

        User updatedUser = userRepository.save(user);

        UserResponseDTO response = new UserResponseDTO();

        response.setId(updatedUser.getId());
        response.setName(updatedUser.getName());
        response.setPhone(updatedUser.getPhone());
        response.setEmail(updatedUser.getEmail());

        return response;
    }
}