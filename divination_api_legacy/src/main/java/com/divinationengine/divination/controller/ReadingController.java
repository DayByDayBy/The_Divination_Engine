package com.divinationengine.divination.controller;

import com.divinationengine.divination.exception.ResourceNotFoundException;
import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.service.CardService;
import com.divinationengine.divination.service.ReadingService;
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
@RequestMapping("/reading")
@Tag(name = "Readings", description = "Tarot reading management endpoints")
public class ReadingController {

    @Autowired
    private ReadingService readingService;

    @Autowired
    private CardService cardService;

    @GetMapping("/3")
    @Operation(summary = "Get 3 random cards", description = "Returns 3 random cards for Three Card Spread")
    @ApiResponse(responseCode = "200", description = "Successfully generated 3 random cards",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Card.class)))
    public ResponseEntity<List<Card>> get3Cards() {
        List<Card> threeCards = cardService.getRandomCards(3);
        return new ResponseEntity<>(threeCards, HttpStatus.OK);
    }

    @GetMapping("/10")
    @Operation(summary = "Get 10 random cards", description = "Returns 10 random cards for Celtic Cross Spread")
    @ApiResponse(responseCode = "200", description = "Successfully generated 10 random cards",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Card.class)))
    public ResponseEntity<List<Card>> get10Cards() {
        List<Card> tenCards = cardService.getRandomCards(10);
        return new ResponseEntity<>(tenCards, HttpStatus.OK);
    }

    @GetMapping("/s")
    @Operation(summary = "Get all readings", description = "Returns a list of all saved tarot readings")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all readings",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Reading.class)))
    public ResponseEntity<List<Reading>> getAllReadings() {
        List<Reading> readings = readingService.getAllReadings();
        return new ResponseEntity<>(readings, HttpStatus.OK);
    }

    @GetMapping("/s/{id}")
    @Operation(summary = "Get reading by ID", description = "Returns a specific reading by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reading found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Reading.class))),
            @ApiResponse(responseCode = "404", description = "Reading not found",
                    content = @Content)
    })
    public ResponseEntity<Reading> getReading(
            @Parameter(description = "ID of the reading to retrieve") @PathVariable Long id) {
        Reading reading = readingService.getReadingById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reading", "id", id));
        return new ResponseEntity<>(reading, HttpStatus.OK);
    }

    @PostMapping("/s")
    @Operation(summary = "Create new reading", description = "Saves a new tarot reading to the database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Reading created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Reading.class))),
            @ApiResponse(responseCode = "400", description = "Invalid reading data",
                    content = @Content)
    })
    public ResponseEntity<Reading> postReading(
            @Parameter(description = "Reading data to save") @RequestBody Reading reading) {
        Reading savedReading = readingService.createReading(reading);
        return new ResponseEntity<>(savedReading, HttpStatus.CREATED);
    }

    @DeleteMapping("/s/{id}")
    @Operation(summary = "Delete reading", description = "Deletes a reading by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Reading deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Reading not found",
                    content = @Content)
    })
    public ResponseEntity<Void> deleteReading(
            @Parameter(description = "ID of the reading to delete") @PathVariable Long id) {
        if (!readingService.existsById(id)) {
            throw new ResourceNotFoundException("Reading", "id", id);
        }
        readingService.deleteReading(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}