package com.jspider.ecommerce.dto;

import java.util.List;

import lombok.Data;

@Data
public class CategoryResponseDto {

    private int id;
    private String name;
    private String description;
    private List<ProductSummaryDTO> products;
}