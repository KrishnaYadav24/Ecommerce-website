
package com.jspider.ecommerce.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class ProductResponseDTO {

    private Integer id;
    private String name;
    private String description;
    private Double price;
    private Integer stock;
    private CategoryResponseDto category;
    private LocalDate mfd;
    private String imageUrl;
}
