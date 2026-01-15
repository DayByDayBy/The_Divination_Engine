package com.divinationengine.divination.dto;

public class CardInterpretDTO {
    
    private String cardName;
    private String position;
    private String meaning;
    private Boolean reversed;
    
    public CardInterpretDTO() {}
    
    public CardInterpretDTO(String cardName, String position, String meaning, Boolean reversed) {
        this.cardName = cardName;
        this.position = position;
        this.meaning = meaning;
        this.reversed = reversed;
    }
    
    public String getCardName() {
        return cardName;
    }
    
    public void setCardName(String cardName) {
        this.cardName = cardName;
    }
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public String getMeaning() {
        return meaning;
    }
    
    public void setMeaning(String meaning) {
        this.meaning = meaning;
    }
    
    public Boolean getReversed() {
        return reversed;
    }
    
    public void setReversed(Boolean reversed) {
        this.reversed = reversed;
    }
}
