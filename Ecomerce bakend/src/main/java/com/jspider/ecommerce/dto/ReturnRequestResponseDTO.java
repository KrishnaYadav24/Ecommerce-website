package com.jspider.ecommerce.dto;

import java.time.LocalDateTime;

import com.jspider.ecommerce.enums.ReturnStatus;

import lombok.Data;

@Data
public class ReturnRequestResponseDTO {

    private Integer returnRequestId;

    private Integer orderId;

    private Integer orderItemId;

    private Integer productId;

    private String productName;

    private Integer quantity;

    private String reason;

    private ReturnStatus returnStatus;

    private LocalDateTime requestDate;
}