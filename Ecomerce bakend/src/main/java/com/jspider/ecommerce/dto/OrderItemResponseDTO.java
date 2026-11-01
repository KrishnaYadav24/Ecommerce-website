package com.jspider.ecommerce.dto;

import lombok.Data;

@Data
public class OrderItemResponseDTO {

    private Integer productId;
    private String productName;
    private Double price;
    private Integer quantity;
    private Integer orderItemId;
}