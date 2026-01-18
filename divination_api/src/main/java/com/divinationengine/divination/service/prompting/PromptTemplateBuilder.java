package com.divinationengine.divination.service.prompting;

import com.divinationengine.divination.dto.CardInterpretDTO;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PromptTemplateBuilder {

    private final ThreeCardPromptTemplate threeCardTemplate;
    private final CelticCrossPromptTemplate celticCrossTemplate;

    public PromptTemplateBuilder(
            ThreeCardPromptTemplate threeCardTemplate,
            CelticCrossPromptTemplate celticCrossTemplate
    ) {
        this.threeCardTemplate = threeCardTemplate;
        this.celticCrossTemplate = celticCrossTemplate;
    }

    public String buildThreeCardPrompt(
            List<CardInterpretDTO> cards,
            String inquiry,
            String focusArea
    ) {
        return threeCardTemplate.buildPrompt(inquiry, focusArea, cards);
    }

    public String buildCelticCrossPrompt(
            List<CardInterpretDTO> cards,
            String inquiry,
            String focusArea
    ) {
        return celticCrossTemplate.buildPrompt(inquiry, focusArea, cards);
    }
}
