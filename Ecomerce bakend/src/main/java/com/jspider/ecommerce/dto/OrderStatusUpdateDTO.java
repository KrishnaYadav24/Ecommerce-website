package com.jspider.ecommerce.dto;

import com.jspider.ecommerce.enums.OrderStatus;

import lombok.Data;

@Data
public class OrderStatusUpdateDTO {

    private OrderStatus status;
}
