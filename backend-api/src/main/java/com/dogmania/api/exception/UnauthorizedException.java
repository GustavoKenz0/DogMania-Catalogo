package com.dogmania.api.exception;

public class UnauthorizedException extends RuntimeException {
    @java.io.Serial
    private static final long serialVersionUID = 1L;

    public UnauthorizedException(String message) {
        super(message);
    }
}
