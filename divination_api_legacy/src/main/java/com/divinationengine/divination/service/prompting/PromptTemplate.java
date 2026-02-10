package com.divinationengine.divination.service.prompting;

import com.divinationengine.divination.dto.CardInterpretDTO;
import java.util.List;

public interface PromptTemplate {
    String buildPrompt(String inquiry, String focusArea, List<CardInterpretDTO> cards);
}
