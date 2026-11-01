package com.jspider.ecommerce.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.jspider.ecommerce.enums.OrderStatus;

import lombok.Data;

@Data
public class OrderResponseDTO {

    private Integer orderId;
    private Double totalAmount;
    private OrderStatus status;

    private List<OrderItemResponseDTO> items;

    private LocalDateTime orderDate;
    private LocalDate expectedDeliveryDate;
    private LocalDate actualDeliveryDate;

    private String deliveryFullName;
    private String deliveryEmail;
    private String deliveryPhone;
    private String deliveryHouseAddress;
    private String deliveryArea;
    private String deliveryLandmark;
    private String deliveryPincode;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryAddressType;
}