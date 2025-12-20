package com.divinationengine.divination.dto;

import java.util.List;

public class ReadingDTO {
    private Long id;
    private List<CardInReadingDTO> cardReadings;

    public ReadingDTO() {
    }

    public ReadingDTO(Long id, List<CardInReadingDTO> cardReadings) {
        this.id = id;
        this.cardReadings = cardReadings;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<CardInReadingDTO> getCardReadings() {
        return cardReadings;
    }

    public void setCardReadings(List<CardInReadingDTO> cardReadings) {
        this.cardReadings = cardReadings;
    }
}
