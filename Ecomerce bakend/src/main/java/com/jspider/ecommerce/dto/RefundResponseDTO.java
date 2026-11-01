package com.jspider.ecommerce.dto;

import java.time.LocalDateTime;

import com.jspider.ecommerce.enums.RefundStatus;

import lombok.Data;

@Data
public class RefundResponseDTO {

    private Integer refundId;
    private Integer returnRequestId;
    private Integer orderId;
    private Double amount;
    private RefundStatus refundStatus;
    private LocalDateTime refundDate;
}