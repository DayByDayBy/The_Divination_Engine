package com.divinationengine.divination.controller;

import com.divinationengine.divination.exception.ResourceNotFoundException;
import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.service.CardService;
import com.divinationengine.divination.service.ReadingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reading")
public class ReadingController {

    @Autowired
    private ReadingService readingService;

    @Autowired
    private CardService cardService;

    @GetMapping("/3")
    public ResponseEntity<List<Card>> get3Cards() {
        List<Card> threeCards = cardService.getRandomCards(3);
        return new ResponseEntity<>(threeCards, HttpStatus.OK);
    }

    @GetMapping("/10")
    public ResponseEntity<List<Card>> get10Cards() {
        List<Card> tenCards = cardService.getRandomCards(10);
        return new ResponseEntity<>(tenCards, HttpStatus.OK);
    }

    @GetMapping("/s")
    public ResponseEntity<List<Reading>> getAllReadings() {
        List<Reading> readings = readingService.getAllReadings();
        return new ResponseEntity<>(readings, HttpStatus.OK);
    }

    @GetMapping("/s/{id}")
    public ResponseEntity<Reading> getReading(@PathVariable Long id) {
        Reading reading = readingService.getReadingById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reading", "id", id));
        return new ResponseEntity<>(reading, HttpStatus.OK);
    }

    @PostMapping("/s")
    public ResponseEntity<Reading> postReading(@RequestBody Reading reading) {
        Reading savedReading = readingService.createReading(reading);
        return new ResponseEntity<>(savedReading, HttpStatus.CREATED);
    }

    @DeleteMapping("/s/{id}")
    public ResponseEntity<Void> deleteReading(@PathVariable Long id) {
        if (!readingService.existsById(id)) {
            throw new ResourceNotFoundException("Reading", "id", id);
        }
        readingService.deleteReading(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}