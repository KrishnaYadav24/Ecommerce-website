package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class OrderAccessDeniedException extends RuntimeException {

    public OrderAccessDeniedException(String message) {
        super(message);
    }
}