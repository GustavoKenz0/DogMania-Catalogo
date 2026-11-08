package com.dogmania.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class SessionUnavailableException extends ResponseStatusException {
    public SessionUnavailableException(Throwable cause) {
        super(HttpStatus.SERVICE_UNAVAILABLE,
                "Não foi possível validar a sessão agora. Tente novamente em instantes.", cause);
    }
}
