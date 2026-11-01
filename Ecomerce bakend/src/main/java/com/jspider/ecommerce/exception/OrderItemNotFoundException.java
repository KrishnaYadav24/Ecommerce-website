
package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class OrderItemNotFoundException extends RuntimeException {

    public OrderItemNotFoundException(String message) {
        super(message);
    }
}
