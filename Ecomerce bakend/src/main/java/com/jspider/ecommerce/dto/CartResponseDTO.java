package com.jspider.ecommerce.dto;

import java.util.List;

import lombok.Data;

@Data
public class CartResponseDTO {

    private Integer cartId;
    private Integer userId;
    private List<CartItemResponseDTO> items;
}