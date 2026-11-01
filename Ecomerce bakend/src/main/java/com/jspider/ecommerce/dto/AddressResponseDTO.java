package com.jspider.ecommerce.dto;

import lombok.Data;

@Data
public class AddressResponseDTO {

    private Integer id;
    private String fullName;
    private String email;
    private String phone;
    private String houseAddress;
    private String area;
    private String landmark;
    private String pincode;
    private String city;
    private String state;
    private String addressType;
    private Boolean isDefault;
}