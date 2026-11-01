
package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class RefundAlreadyExistsException extends RuntimeException {

    public RefundAlreadyExistsException(String message) {
        super(message);
    }
}
