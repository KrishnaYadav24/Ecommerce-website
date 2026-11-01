package com.jspider.ecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import lombok.Data;

@Data
public class AddressRequestDTO {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "House address is required")
    private String houseAddress;

    @NotBlank(message = "Area is required")
    private String area;

    private String landmark;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must contain 6 digits")
    private String pincode;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Address type is required")
    @Pattern(
        regexp = "Home|Work|Other",
        message = "Address type must be Home, Work or Other"
    )
    private String addressType;

    private Boolean isDefault = false;
}