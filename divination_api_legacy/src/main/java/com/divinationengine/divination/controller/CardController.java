package com.divinationengine.divination.controller;

import com.divinationengine.divination.exception.ResourceNotFoundException;
import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.service.CardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cards")
@Tag(name = "Cards", description = "Tarot card management endpoints")
public class CardController {

    @Autowired
    private CardService cardService;

    @GetMapping
    @Operation(summary = "Get all tarot cards", description = "Returns a list of all available tarot cards in the deck")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all cards",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Card.class)))
    public ResponseEntity<List<Card>> getAllCards() {
        List<Card> cards = cardService.getAllCards();
        return new ResponseEntity<>(cards, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get card by ID", description = "Returns a specific tarot card by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Card found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Card.class))),
            @ApiResponse(responseCode = "404", description = "Card not found",
                    content = @Content)
    })
    public ResponseEntity<Card> getCard(
            @Parameter(description = "ID of the card to retrieve") @PathVariable Long id) {
        Card card = cardService.getCardById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", id));
        return new ResponseEntity<>(card, HttpStatus.OK);
    }

}