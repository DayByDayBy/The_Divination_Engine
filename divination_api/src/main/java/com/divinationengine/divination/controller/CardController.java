package com.divinationengine.divination.controller;

import com.divinationengine.divination.exception.ResourceNotFoundException;
import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cards")
public class CardController {

    @Autowired
    private CardService cardService;

    @GetMapping
    public ResponseEntity<List<Card>> getAllCards() {
        List<Card> cards = cardService.getAllCards();
        return new ResponseEntity<>(cards, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Card> getCard(@PathVariable Long id) {
        Card card = cardService.getCardById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", id));
        return new ResponseEntity<>(card, HttpStatus.OK);
    }

}