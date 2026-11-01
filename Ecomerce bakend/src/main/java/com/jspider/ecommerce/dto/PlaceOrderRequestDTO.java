package com.jspider.ecommerce.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class PlaceOrderRequestDTO {

    @NotNull(message = "Delivery address is required")
    @Positive(message = "Invalid delivery address ID")
    private Integer addressId;
}