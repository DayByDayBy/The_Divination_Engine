package com.divinationengine.divination.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class InterpretRequest {
    
    @NotNull(message = "Reading ID is required")
    private Long readingId;
    
    @NotEmpty(message = "Cards are required")
    @Valid
    private List<CardInterpretDTO> cards;
    
    @NotBlank(message = "Spread type is required")
    private String spreadType;
    
    private String userContext;
    
    public InterpretRequest() {}
    
    public InterpretRequest(Long readingId, List<CardInterpretDTO> cards, String spreadType, String userContext) {
        this.readingId = readingId;
        this.cards = cards;
        this.spreadType = spreadType;
        this.userContext = userContext;
    }
    
    public Long getReadingId() {
        return readingId;
    }
    
    public void setReadingId(Long readingId) {
        this.readingId = readingId;
    }
    
    public List<CardInterpretDTO> getCards() {
        return cards;
    }
    
    public void setCards(List<CardInterpretDTO> cards) {
        this.cards = cards;
    }
    
    public String getSpreadType() {
        return spreadType;
    }
    
    public void setSpreadType(String spreadType) {
        this.spreadType = spreadType;
    }
    
    public String getUserContext() {
        return userContext;
    }
    
    public void setUserContext(String userContext) {
        this.userContext = userContext;
    }
}
