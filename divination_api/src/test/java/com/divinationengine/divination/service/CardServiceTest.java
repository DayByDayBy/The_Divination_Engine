package com.divinationengine.divination.service;

import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.models.CardType;
import com.divinationengine.divination.repository.CardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock
    private CardRepository cardRepository;

    @InjectMocks
    private CardService cardService;

    private Card testCard;

    @BeforeEach
    void setUp() {
        testCard = new Card();
        testCard.setId(1L);
        testCard.setType(CardType.major);
        testCard.setName("The Fool");
        testCard.setMeaningUp("New beginnings");
        testCard.setMeaningRev("Recklessness");
    }

    @Test
    void getAllCards_ShouldReturnAllCards() {
        // Given
        List<Card> cards = Arrays.asList(testCard);
        when(cardRepository.findAll()).thenReturn(cards);

        // When
        List<Card> result = cardService.getAllCards();

        // Then
        assertEquals(1, result.size());
        assertEquals(testCard, result.get(0));
        verify(cardRepository, times(1)).findAll();
    }

    @Test
    void getCardById_WithValidId_ShouldReturnCard() {
        // Given
        when(cardRepository.findById(1L)).thenReturn(Optional.of(testCard));

        // When
        Optional<Card> result = cardService.getCardById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testCard, result.get());
        verify(cardRepository, times(1)).findById(1L);
    }

    @Test
    void getCardById_WithInvalidId_ShouldReturnEmpty() {
        // Given
        when(cardRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Optional<Card> result = cardService.getCardById(999L);

        // Then
        assertFalse(result.isPresent());
        verify(cardRepository, times(1)).findById(999L);
    }

    @Test
    void getRandomCards_ShouldReturnSpecifiedNumberOfCards() {
        // Given
        List<Card> cards = Arrays.asList(testCard, new Card(), new Card());
        when(cardRepository.findRandomCardsOfCount(3)).thenReturn(cards);

        // When
        List<Card> result = cardService.getRandomCards(3);

        // Then
        assertEquals(3, result.size());
        verify(cardRepository, times(1)).findRandomCardsOfCount(3);
    }
}
