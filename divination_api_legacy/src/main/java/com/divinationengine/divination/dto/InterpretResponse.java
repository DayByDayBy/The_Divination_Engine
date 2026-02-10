package com.divinationengine.divination.dto;

import java.time.Instant;

public class InterpretResponse {
    
    private String interpretation;
    private String tier;
    private Long readingId;
    private Instant timestamp;
    private String spreadType;
    
    public InterpretResponse() {}
    
    public InterpretResponse(String interpretation, String tier, Long readingId) {
        this.interpretation = interpretation;
        this.tier = tier;
        this.readingId = readingId;
    }
    
    public InterpretResponse(Long readingId, String interpretation, Instant timestamp, String spreadType, String tier) {
        this.readingId = readingId;
        this.interpretation = interpretation;
        this.timestamp = timestamp;
        this.spreadType = spreadType;
        this.tier = tier;
    }
    
    public String getInterpretation() {
        return interpretation;
    }
    
    public void setInterpretation(String interpretation) {
        this.interpretation = interpretation;
    }
    
    public String getTier() {
        return tier;
    }
    
    public void setTier(String tier) {
        this.tier = tier;
    }
    
    public Long getReadingId() {
        return readingId;
    }
    
    public void setReadingId(Long readingId) {
        this.readingId = readingId;
    }
    
    public Instant getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getSpreadType() {
        return spreadType;
    }
    
    public void setSpreadType(String spreadType) {
        this.spreadType = spreadType;
    }
}
