package com.divinationengine.divination.service;

import com.divinationengine.divination.models.User;
import com.divinationengine.divination.models.UserTier;
import com.divinationengine.divination.repository.UserRepository;
import com.divinationengine.divination.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
    
    public User registerUser(String email, String password) throws RuntimeException {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(email, hashedPassword);
        user.setTier(UserTier.FREE);
        
        return userRepository.save(user);
    }
    
    public String loginUser(String email, String password) throws RuntimeException {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        return jwtUtil.generateToken(user.getId(), user.getEmail(), user.getTier().toString());
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findById(UUID userId) {
        return userRepository.findById(userId);
    }
    
    public User updateUserTier(UUID userId, UserTier newTier) throws RuntimeException {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        user.setTier(newTier);
        return userRepository.save(user);
    }
}
