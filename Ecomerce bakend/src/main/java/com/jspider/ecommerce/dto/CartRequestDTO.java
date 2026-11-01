package com.jspider.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartRequestDTO {

    @NotNull
    private Integer userId;

    @NotNull
    private Integer productId;

    @Min(1)
    private Integer quantity;
}