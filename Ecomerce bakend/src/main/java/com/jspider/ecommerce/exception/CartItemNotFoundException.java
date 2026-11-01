package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class CartItemNotFoundException extends RuntimeException {

    public CartItemNotFoundException(String message) {
        super(message);
    }
}