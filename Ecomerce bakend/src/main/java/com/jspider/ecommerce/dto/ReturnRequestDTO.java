package com.jspider.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class ReturnRequestDTO {

    @NotNull
    private Integer orderItemId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotBlank
    private String reason;
}