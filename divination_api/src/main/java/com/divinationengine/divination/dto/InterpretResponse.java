package com.divinationengine.divination.dto;

public class InterpretResponse {
    
    private String interpretation;
    private String tier;
    private Long readingId;
    
    public InterpretResponse() {}
    
    public InterpretResponse(String interpretation, String tier, Long readingId) {
        this.interpretation = interpretation;
        this.tier = tier;
        this.readingId = readingId;
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
}
