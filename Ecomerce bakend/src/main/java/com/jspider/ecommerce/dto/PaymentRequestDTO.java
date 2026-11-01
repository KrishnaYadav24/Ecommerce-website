package com.jspider.ecommerce.dto;

import com.jspider.ecommerce.enums.PaymentMethod;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequestDTO {

    @NotNull
    private PaymentMethod paymentMethod;
}
