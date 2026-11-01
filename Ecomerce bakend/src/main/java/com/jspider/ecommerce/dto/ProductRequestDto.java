package com.jspider.ecommerce.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class ProductRequestDto {

    @NotBlank
    private String name;

    @NotEmpty
    private String description;

    @Min(150)
    private Double price;

    @Min(15)
    private int stock;

    @NotNull
    private Integer categoryId;

    private LocalDate mfd;

    private String imageUrl;
}
