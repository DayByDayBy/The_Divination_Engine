package com.divinationengine.divination.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitService.class);
    
    private final RedisTemplate<String, String> redisTemplate;
    
    // Rate limits per tier
    private static final int FREE_LIMIT = 3;
    private static final int BASIC_LIMIT = 20;
    private static final int PREMIUM_LIMIT = Integer.MAX_VALUE; // Unlimited
    
    public RateLimitService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * Check if user has exceeded their daily rate limit
     * @param userId User ID
     * @param tier User tier (FREE, BASIC, PREMIUM)
     * @return RateLimitResult with allowed status and remaining count
     */
    public RateLimitResult checkRateLimit(String userId, String tier) {
        String dailyKey = buildDailyKey(userId);
        int limit = getLimitForTier(tier);
        
        // Premium users have unlimited access
        if (limit == Integer.MAX_VALUE) {
            logger.debug("Premium user {} has unlimited access", userId);
            return new RateLimitResult(true, Integer.MAX_VALUE, 0);
        }
        
        try {
            // Atomic increment-first approach to eliminate race condition
            Long newCount = redisTemplate.opsForValue().increment(dailyKey);
            if (newCount == null) {
                // Redis operation failed, fail open
                logger.error("Redis increment returned null for user {}", userId);
                return new RateLimitResult(true, 1, 0);
            }
            
            if (newCount == 1) {
                // Set expiration to end of current UTC day (24 hours from first request)
                redisTemplate.expire(dailyKey, getSecondsUntilEndOfDay(), TimeUnit.SECONDS);
            }
            
            if (newCount > limit) {
                logger.info("User {} with tier {} exceeded daily limit: {}/{}", userId, tier, newCount, limit);
                return new RateLimitResult(false, 0, (int) getSecondsUntilEndOfDay());
            }
            
            int remaining = Math.max(0, limit - newCount.intValue());
            logger.debug("User {} with tier {} used {}/{} interpretations, remaining: {}", 
                userId, tier, newCount, limit, remaining);
            
            return new RateLimitResult(true, remaining, (int) getSecondsUntilEndOfDay());
            
        } catch (Exception e) {
            logger.error("Error checking rate limit for user {}: {}", userId, e.getMessage(), e);
            // Fail open - allow request if Redis is unavailable
            return new RateLimitResult(true, 1, 0);
        }
    }
    
    private int getLimitForTier(String tier) {
        if (tier == null) {
            return FREE_LIMIT;
        }
        return switch (tier.toUpperCase()) {
            case "FREE" -> FREE_LIMIT;
            case "BASIC" -> BASIC_LIMIT;
            case "PREMIUM", "PRO" -> PREMIUM_LIMIT;
            default -> FREE_LIMIT; // Default to most restrictive
        };
    }
    
    private String buildDailyKey(String userId) {
        String today = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_LOCAL_DATE);
        return String.format("rate_limit:interpretations:%s:%s", userId, today);
    }
    
    private long getSecondsUntilEndOfDay() {
        LocalDate tomorrow = LocalDate.now(ZoneOffset.UTC).plusDays(1);
        return Duration.between(
            java.time.Instant.now(), 
            tomorrow.atStartOfDay().toInstant(ZoneOffset.UTC)
        ).getSeconds();
    }
    
    /**
     * Result of rate limit check
     */
    public static class RateLimitResult {
        private final boolean allowed;
        private final int remaining;
        private final int resetInSeconds;
        
        public RateLimitResult(boolean allowed, int remaining, int resetInSeconds) {
            this.allowed = allowed;
            this.remaining = remaining;
            this.resetInSeconds = resetInSeconds;
        }
        
        public boolean isAllowed() {
            return allowed;
        }
        
        public int getRemaining() {
            return remaining;
        }
        
        public int getResetInSeconds() {
            return resetInSeconds;
        }
    }
}
