package com.jspider.ecommerce.dto;

import java.time.LocalDateTime;

import com.jspider.ecommerce.enums.PaymentMethod;
import com.jspider.ecommerce.enums.PaymentStatus;

import lombok.Data;

@Data
public class PaymentResponseDTO {

	private Integer paymentId;
	private Integer orderId;
	private Double amount;
	private PaymentMethod paymentMethod;
	private PaymentStatus paymentStatus;
	private LocalDateTime paymentDate;
}