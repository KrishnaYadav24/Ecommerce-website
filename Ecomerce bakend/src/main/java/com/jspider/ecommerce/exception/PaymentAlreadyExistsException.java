package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class PaymentAlreadyExistsException extends RuntimeException {

    public PaymentAlreadyExistsException(String message) {
        super(message);
    }
}