package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class InvalidOrderStatusException extends RuntimeException {

    public InvalidOrderStatusException(String message) {
        super(message);
    }
}