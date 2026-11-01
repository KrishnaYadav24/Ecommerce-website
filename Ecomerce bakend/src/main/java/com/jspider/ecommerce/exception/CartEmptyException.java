package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class CartEmptyException extends RuntimeException {

    public CartEmptyException(String message) {
        super(message);
    }
}