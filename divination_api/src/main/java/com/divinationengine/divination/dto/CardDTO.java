package com.divinationengine.divination.dto;

import com.divinationengine.divination.models.CardType;

public class CardDTO {
    private Long id;
    private CardType type;
    private String suit;
    private String nameShort;
    private String name;
    private String value;
    private Integer intValue;
    private String meaningUp;
    private String meaningRev;
    private String description;

    public CardDTO() {
    }

    public CardDTO(Long id, CardType type, String suit, String nameShort, String name, 
                   String value, Integer intValue, String meaningUp, String meaningRev, String description) {
        this.id = id;
        this.type = type;
        this.suit = suit;
        this.nameShort = nameShort;
        this.name = name;
        this.value = value;
        this.intValue = intValue;
        this.meaningUp = meaningUp;
        this.meaningRev = meaningRev;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CardType getType() {
        return type;
    }

    public void setType(CardType type) {
        this.type = type;
    }

    public String getSuit() {
        return suit;
    }

    public void setSuit(String suit) {
        this.suit = suit;
    }

    public String getNameShort() {
        return nameShort;
    }

    public void setNameShort(String nameShort) {
        this.nameShort = nameShort;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Integer getIntValue() {
        return intValue;
    }

    public void setIntValue(Integer intValue) {
        this.intValue = intValue;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
