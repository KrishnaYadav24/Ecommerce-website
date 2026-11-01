
package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class InvalidRefundStatusException extends RuntimeException {

    public InvalidRefundStatusException(String message) {
        super(message);
    }
}
