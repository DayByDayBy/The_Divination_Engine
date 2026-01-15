package com.divinationengine.divination.service;

import com.divinationengine.divination.models.User;
import com.divinationengine.divination.models.UserTier;
import com.divinationengine.divination.repository.UserRepository;
import com.divinationengine.divination.security.JwtUtil;
import com.divinationengine.divination.exception.UserAlreadyExistsException;
import com.divinationengine.divination.exception.InvalidCredentialsException;
import com.divinationengine.divination.exception.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
    
    public User registerUser(String email, String password) throws UserAlreadyExistsException {
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(email, hashedPassword);
        user.setTier(UserTier.FREE);
        
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            logger.warn("Registration failed due to duplicate email");
            throw new UserAlreadyExistsException("Email already exists");
        }
    }
    
    public String loginUser(String email, String password) throws InvalidCredentialsException {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            logger.warn("Login attempt for non-existent account");
            throw new InvalidCredentialsException("Invalid credentials");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            logger.warn("Invalid password attempt");
            throw new InvalidCredentialsException("Invalid credentials");
        }
        
        return jwtUtil.generateToken(user.getId(), user.getTier().toString());
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findById(UUID userId) {
        return userRepository.findById(userId);
    }
    
    @Transactional
    public User updateUserTier(UUID userId, UserTier newTier) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        user.setTier(newTier);
        return userRepository.save(user);
    }
}
