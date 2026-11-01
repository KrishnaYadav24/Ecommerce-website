
package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class RefundNotFoundException extends RuntimeException {

    public RefundNotFoundException(String message) {
        super(message);
    }
}
