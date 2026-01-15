package com.divinationengine.divination.controller;

import com.divinationengine.divination.dto.AuthResponse;
import com.divinationengine.divination.dto.LoginRequest;
import com.divinationengine.divination.dto.RegisterRequest;
import com.divinationengine.divination.models.User;
import com.divinationengine.divination.service.UserService;
import com.divinationengine.divination.exception.UserAlreadyExistsException;
import com.divinationengine.divination.exception.InvalidCredentialsException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;
    
    @Operation(summary = "Register a new user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User registered successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = userService.registerUser(registerRequest.getEmail(), registerRequest.getPassword());
            String token = userService.loginUser(registerRequest.getEmail(), registerRequest.getPassword());
            
            AuthResponse response = new AuthResponse(token, user.getEmail(), user.getTier().toString());
            return ResponseEntity.ok(response);
        } catch (UserAlreadyExistsException e) {
            logger.warn("Registration attempt with existing email hash: {}", hashEmail(registerRequest.getEmail()));
            return ResponseEntity.badRequest().body("User already exists");
        } catch (InvalidCredentialsException e) {
            logger.error("Registration failed unexpectedly", e);
            return ResponseEntity.badRequest().body("Invalid request");
        } catch (Exception e) {
            logger.error("Registration failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Registration failed");
        }
    }
    
    @Operation(summary = "Authenticate user and return JWT token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Authentication successful"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String token = userService.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
            User user = userService.findByEmail(loginRequest.getEmail()).orElse(null);
            
            if (user == null) {
                throw new InvalidCredentialsException("Invalid credentials");
            }
            
            AuthResponse response = new AuthResponse(token, user.getEmail(), user.getTier().toString());
            return ResponseEntity.ok(response);
        } catch (InvalidCredentialsException e) {
            logger.warn("Login attempt failed for email hash: {}", hashEmail(loginRequest.getEmail()));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        } catch (Exception e) {
            logger.error("Login failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Authentication failed");
        }
    }
    
    private static String hashEmail(String email) {
        if (email == null) {
            return "null";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(email.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return "sha256_unavailable";
        }
    }
}
