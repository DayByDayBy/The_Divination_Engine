package com.divinationengine.divination.dto;

public class AuthResponse {
    
    private String token;
    private String type = "Bearer";
    private String email;
    private String tier;
    
    public AuthResponse() {}
    
    public AuthResponse(String token, String email, String tier) {
        this.token = token;
        this.email = email;
        this.tier = tier;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getTier() {
        return tier;
    }
    
    public void setTier(String tier) {
        this.tier = tier;
    }
}
