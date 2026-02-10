package com.divinationengine.divination.service;

public interface LlmService {
    
    String generateInterpretation(String prompt) throws LlmServiceException;
}
