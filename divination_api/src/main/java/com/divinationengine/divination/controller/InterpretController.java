package com.divinationengine.divination.controller;

import com.divinationengine.divination.dto.InterpretRequest;
import com.divinationengine.divination.dto.InterpretResponse;
import com.divinationengine.divination.service.InterpretationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tarot")
public class InterpretController {

    private final InterpretationService interpretationService;

    public InterpretController(InterpretationService interpretationService) {
        this.interpretationService = interpretationService;
    }

    @PostMapping("/interpret")
    public ResponseEntity<InterpretResponse> interpret(@Valid @RequestBody InterpretRequest request,
                                                      Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = authentication.getPrincipal().toString();
        String tier = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");

        if (tier.startsWith("ROLE_")) {
            tier = tier.substring("ROLE_".length());
        }

        InterpretResponse response = interpretationService.interpret(request, userId, tier);
        return ResponseEntity.ok(response);
    }
}
