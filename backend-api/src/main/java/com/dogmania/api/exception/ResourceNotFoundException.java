package com.dogmania.api.exception;

public class ResourceNotFoundException extends RuntimeException {
    @java.io.Serial
    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
