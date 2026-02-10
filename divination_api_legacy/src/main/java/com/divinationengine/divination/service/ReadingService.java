package com.divinationengine.divination.service;

import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.repository.ReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReadingService {

    @Autowired
    private ReadingRepository readingRepository;

    public List<Reading> getAllReadings() {
        return readingRepository.findAll();
    }

    public Optional<Reading> getReadingById(Long id) {
        return readingRepository.findById(id);
    }

    public Reading createReading(Reading reading) {
        return readingRepository.save(reading);
    }

    public void deleteReading(Long id) {
        readingRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return readingRepository.existsById(id);
    }
}
