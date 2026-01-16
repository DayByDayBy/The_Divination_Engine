package com.divinationengine.divination.dto;

public class CardInterpretDTO {
    
    private String name;
    private Boolean reversed;
    private String meaningUp;
    private String meaningRev;
    private String position;
    
    public CardInterpretDTO() {}
    
    public CardInterpretDTO(String name, Boolean reversed, String meaningUp, String meaningRev, String position) {
        this.name = name;
        this.reversed = reversed;
        this.meaningUp = meaningUp;
        this.meaningRev = meaningRev;
        this.position = position;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Boolean getReversed() {
        return reversed;
    }
    
    public void setReversed(Boolean reversed) {
        this.reversed = reversed;
    }
    
    public String getMeaningUp() {
        return meaningUp;
    }
    
    public void setMeaningUp(String meaningUp) {
        this.meaningUp = meaningUp;
    }
    
    public String getMeaningRev() {
        return meaningRev;
    }
    
    public void setMeaningRev(String meaningRev) {
        this.meaningRev = meaningRev;
    }
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
}
