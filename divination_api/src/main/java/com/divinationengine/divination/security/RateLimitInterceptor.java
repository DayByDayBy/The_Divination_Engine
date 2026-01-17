package com.divinationengine.divination.security;

import com.divinationengine.divination.service.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashMap;
import java.util.Map;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);
    
    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    public RateLimitInterceptor(RateLimitService rateLimitService, ObjectMapper objectMapper) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Only apply rate limiting to interpret endpoint
        if (!request.getRequestURI().equals("/tarot/interpret")) {
            return true;
        }

        // Get user ID and tier from authentication context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.warn("Unauthenticated request to interpret endpoint");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return false;
        }

        String userId = authentication.getName();
        String tier = resolveTier(authentication);

        // Check rate limit
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(userId, tier);
        
        if (!result.isAllowed()) {
            logger.info("Rate limit exceeded for user {} with tier {}: {}", userId, tier, result.getRemaining());
            
            // Set 429 response headers
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(result.getResetInSeconds()));
            response.setContentType("application/json");
            
            // Create error response with upgrade hint
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Rate limit exceeded");
            errorResponse.put("message", String.format("Daily limit of %d interpretations exceeded for %s tier users", 
                getLimitForTier(tier), tier.toLowerCase()));
            errorResponse.put("retryAfter", result.getResetInSeconds());
            errorResponse.put("upgradeHint", getUpgradeHint(tier));
            
            // Write error response
            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            return false;
        }

        // Add rate limit headers for successful requests
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.getResetInSeconds()));
        
        logger.debug("Rate limit check passed for user {} with tier {}: {} remaining", 
            userId, tier, result.getRemaining());
        
        return true;
    }

    private String resolveTier(Authentication authentication) {
        // Extract tier from authorities (same logic as InterpretController)
        return authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .findFirst()
                .orElse("FREE"); // Default to FREE if no tier found
    }

    private int getLimitForTier(String tier) {
        return switch (tier.toUpperCase()) {
            case "FREE" -> 3;
            case "BASIC" -> 20;
            case "PREMIUM", "PRO" -> Integer.MAX_VALUE;
            default -> 3;
        };
    }

    private String getUpgradeHint(String currentTier) {
        return switch (currentTier.toUpperCase()) {
            case "FREE" -> "Upgrade to BASIC for 20 interpretations per day";
            case "BASIC" -> "Upgrade to PREMIUM for unlimited interpretations";
            case "PREMIUM", "PRO" -> "You already have unlimited access";
            default -> "Consider upgrading your plan for higher limits";
        };
    }
}
