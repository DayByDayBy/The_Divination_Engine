package com.divinationengine.divination.service;

import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.repository.CardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CardService {

    @Autowired
    private CardRepository cardRepository;

    public List<Card> getAllCards() {
        return cardRepository.findAll();
    }

    public Optional<Card> getCardById(Long id) {
        return cardRepository.findById(id);
    }

    public List<Card> getRandomCards(int count) {
        return cardRepository.findRandomCardsOfCount(count);
    }
}
