package com.divinationengine.divination.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class LlmGenerationException extends RuntimeException {
    
    public LlmGenerationException(String message) {
        super(message);
    }
    
    public LlmGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
