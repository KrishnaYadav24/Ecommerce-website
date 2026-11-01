
package com.jspider.ecommerce.exception;

@SuppressWarnings("serial")
public class ReturnRequestNotFoundException extends RuntimeException {

    public ReturnRequestNotFoundException(String message) {
        super(message);
    }
}