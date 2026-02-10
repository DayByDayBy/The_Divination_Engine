package com.divinationengine.divination.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table (name = "readings")
public class Reading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "llm_interpretation", columnDefinition = "TEXT")
    private String llmInterpretation;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @JsonIgnoreProperties({"reading"})
    @OneToMany(mappedBy = "reading", cascade = CascadeType.ALL)
    private List<CardInReading> cardReadings = new ArrayList<>();

    public Reading() {
        this.createdAt = LocalDateTime.now();
    }

    public Reading(List<CardInReading> cardReadings) {
        this();
        setCardReadings(cardReadings);
    }

    public Reading(UUID userId, List<CardInReading> cardReadings) {
        this();
        this.userId = userId;
        setCardReadings(cardReadings);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getLlmInterpretation() {
        return llmInterpretation;
    }

    public void setLlmInterpretation(String llmInterpretation) {
        this.llmInterpretation = llmInterpretation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<CardInReading> getCardReadings() {
        return cardReadings;
    }

    public void setCardReadings(List<CardInReading> cardReadings) {
        this.cardReadings = cardReadings != null ? cardReadings : new ArrayList<>();
        this.cardReadings.forEach(cr -> cr.setReading(this));
    }
}
