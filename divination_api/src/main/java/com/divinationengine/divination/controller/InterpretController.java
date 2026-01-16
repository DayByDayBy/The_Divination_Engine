package com.divinationengine.divination.controller;

import com.divinationengine.divination.dto.InterpretRequest;
import com.divinationengine.divination.dto.InterpretResponse;
import com.divinationengine.divination.service.InterpretationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.util.List;

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

        String userId = resolveUserId(authentication);
        String tier = resolveTier(authentication);

        InterpretResponse response = interpretationService.interpret(request, userId, tier);
        return ResponseEntity.ok(response);
    }

    private static String resolveUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        String jwtSubject = tryGetJwtSubject(principal);
        if (jwtSubject != null && !jwtSubject.isBlank()) {
            return jwtSubject;
        }

        return authentication.getName();
    }

    private static String tryGetJwtSubject(Object principal) {
        if (principal == null) {
            return null;
        }

        if (!principal.getClass().getName().equals("org.springframework.security.oauth2.jwt.Jwt")) {
            return null;
        }

        try {
            Method getSubject = principal.getClass().getMethod("getSubject");
            Object subject = getSubject.invoke(principal);
            return subject == null ? null : subject.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private static String resolveTier(Authentication authentication) {
        List<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        for (String role : List.of("ROLE_PREMIUM", "ROLE_PRO", "ROLE_BASIC", "ROLE_FREE", "ROLE_USER")) {
            if (authorities.contains(role)) {
                return role.substring("ROLE_".length());
            }
        }

        return authorities.stream()
                .filter(a -> a != null && a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User tier is not available"));
    }
}
