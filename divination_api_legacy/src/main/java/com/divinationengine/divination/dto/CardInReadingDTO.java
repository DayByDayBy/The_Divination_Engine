package com.divinationengine.divination.dto;

public class CardInReadingDTO {
    private Long id;
    private CardDTO card;
    private int position;
    private boolean reversed;

    public CardInReadingDTO() {
    }

    public CardInReadingDTO(Long id, CardDTO card, int position, boolean reversed) {
        this.id = id;
        this.card = card;
        this.position = position;
        this.reversed = reversed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CardDTO getCard() {
        return card;
    }

    public void setCard(CardDTO card) {
        this.card = card;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public boolean isReversed() {
        return reversed;
    }

    public void setReversed(boolean reversed) {
        this.reversed = reversed;
    }
}
