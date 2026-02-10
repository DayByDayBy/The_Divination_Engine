package com.divinationengine.divination.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RateLimitService rateLimitService;

    private String testUserId;
    private String testTier;

    @BeforeEach
    void setUp() {
        testUserId = "test-user-123";
        testTier = "FREE";
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void checkRateLimit_FreeUser_FirstRequest_ShouldAllow() {
        // Given
        when(valueOperations.get(anyString())).thenReturn(null);
        when(valueOperations.increment(anyString())).thenReturn(1L);
        when(redisTemplate.expire(anyString(), anyLong(), any(TimeUnit.class))).thenReturn(true);

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed());
        assertEquals(2, result.getRemaining()); // 3 - 1 = 2 remaining
        verify(valueOperations).increment(contains("rate_limit:interpretations:test-user-123:"));
        verify(redisTemplate).expire(anyString(), anyLong(), eq(TimeUnit.SECONDS));
    }

    @Test
    void checkRateLimit_FreeUser_AtLimit_ShouldAllow() {
        // Given
        when(valueOperations.get(anyString())).thenReturn("2"); // Already used 2 out of 3
        when(valueOperations.increment(anyString())).thenReturn(3L);

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed());
        assertEquals(0, result.getRemaining()); // 3 - 3 = 0 remaining
    }

    @Test
    void checkRateLimit_FreeUser_ExceedsLimit_ShouldDeny() {
        // Given
        when(valueOperations.get(anyString())).thenReturn("3"); // Already used 3 out of 3

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertFalse(result.isAllowed());
        assertEquals(0, result.getRemaining());
        verify(valueOperations, never()).increment(anyString());
    }

    @Test
    void checkRateLimit_BasicUser_ShouldHaveHigherLimit() {
        // Given
        testTier = "BASIC";
        when(valueOperations.get(anyString())).thenReturn("19"); // Used 19 out of 20
        when(valueOperations.increment(anyString())).thenReturn(20L);

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed());
        assertEquals(0, result.getRemaining()); // 20 - 20 = 0 remaining
    }

    @Test
    void checkRateLimit_PremiumUser_ShouldHaveUnlimitedAccess() {
        // Given
        testTier = "PREMIUM";

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed());
        assertEquals(Integer.MAX_VALUE, result.getRemaining());
        verify(valueOperations, never()).get(anyString());
        verify(valueOperations, never()).increment(anyString());
    }

    @Test
    void checkRateLimit_ProUser_ShouldHaveUnlimitedAccess() {
        // Given
        testTier = "PRO";

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed());
        assertEquals(Integer.MAX_VALUE, result.getRemaining());
        verify(valueOperations, never()).get(anyString());
        verify(valueOperations, never()).increment(anyString());
    }

    @Test
    void checkRateLimit_UnknownTier_ShouldDefaultToFree() {
        // Given
        testTier = "UNKNOWN";
        when(valueOperations.get(anyString())).thenReturn("2");
        when(valueOperations.increment(anyString())).thenReturn(3L);

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed());
        assertEquals(0, result.getRemaining()); // Should use FREE tier limits
    }

    @Test
    void checkRateLimit_RedisError_ShouldFailOpen() {
        // Given
        when(valueOperations.get(anyString())).thenThrow(new RuntimeException("Redis connection failed"));

        // When
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(testUserId, testTier);

        // Then
        assertTrue(result.isAllowed()); // Should allow request when Redis fails
        assertEquals(1, result.getRemaining());
    }
}
