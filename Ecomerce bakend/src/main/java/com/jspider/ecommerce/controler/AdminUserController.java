package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.RoleUpdateDTO;
import com.jspider.ecommerce.dto.UserResponseDTO;
import com.jspider.ecommerce.service.AdminUserService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<UserResponseDTO> getAllUsers() {

        return adminUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponseDTO getUserById(
            @PathVariable int id) {

        return adminUserService.getUserById(id);
    }
    
    @PutMapping("/{id}/role")
    public UserResponseDTO updateUserRole(
            @PathVariable int id,
            @Valid @RequestBody RoleUpdateDTO request) {

        return adminUserService.updateUserRole(id, request);
    }
}