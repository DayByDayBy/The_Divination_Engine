package com.divinationengine.divination.service;

import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.repository.ReadingRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReadingServiceTest {

    @Mock
    private ReadingRepository readingRepository;

    @InjectMocks
    private ReadingService readingService;

    private Reading testReading;

    @BeforeEach
    void setUp() {
        testReading = new Reading();
        testReading.setId(1L);
    }

    @Test
    void getAllReadings_ShouldReturnAllReadings() {
        // Given
        List<Reading> readings = Arrays.asList(testReading);
        when(readingRepository.findAll()).thenReturn(readings);

        // When
        List<Reading> result = readingService.getAllReadings();

        // Then
        assertEquals(1, result.size());
        assertEquals(testReading, result.get(0));
        verify(readingRepository, times(1)).findAll();
    }

    @Test
    void getReadingById_WithValidId_ShouldReturnReading() {
        // Given
        when(readingRepository.findById(1L)).thenReturn(Optional.of(testReading));

        // When
        Optional<Reading> result = readingService.getReadingById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testReading, result.get());
        verify(readingRepository, times(1)).findById(1L);
    }

    @Test
    void getReadingById_WithInvalidId_ShouldReturnEmpty() {
        // Given
        when(readingRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Optional<Reading> result = readingService.getReadingById(999L);

        // Then
        assertFalse(result.isPresent());
        verify(readingRepository, times(1)).findById(999L);
    }

    @Test
    void createReading_ShouldSaveAndReturnReading() {
        // Given
        when(readingRepository.save(testReading)).thenReturn(testReading);

        // When
        Reading result = readingService.createReading(testReading);

        // Then
        assertEquals(testReading, result);
        verify(readingRepository, times(1)).save(testReading);
    }

    @Test
    void deleteReading_ShouldDeleteReading() {
        // When
        readingService.deleteReading(1L);

        // Then
        verify(readingRepository, times(1)).deleteById(1L);
    }

    @Test
    void existsById_WithValidId_ShouldReturnTrue() {
        // Given
        when(readingRepository.existsById(1L)).thenReturn(true);

        // When
        boolean result = readingService.existsById(1L);

        // Then
        assertTrue(result);
        verify(readingRepository, times(1)).existsById(1L);
    }

    @Test
    void existsById_WithInvalidId_ShouldReturnFalse() {
        // Given
        when(readingRepository.existsById(999L)).thenReturn(false);

        // When
        boolean result = readingService.existsById(999L);

        // Then
        assertFalse(result);
        verify(readingRepository, times(1)).existsById(999L);
    }
}
