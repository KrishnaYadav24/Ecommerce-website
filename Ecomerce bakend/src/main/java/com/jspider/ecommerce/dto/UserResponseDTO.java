package com.jspider.ecommerce.dto;



import lombok.Data;

@Data
public class UserResponseDTO {


    private Integer id;

    private String name;

    private String email;

    private String phone;
}