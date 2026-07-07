package com.proyecto.farmacia.web.dto;

import java.util.List;

public class TokenResponse {

    private String tokenType;
    private String token;
    private List<String> roles;

    public TokenResponse() {
    }

    public TokenResponse(String tokenType, String token, List<String> roles) {
        this.tokenType = tokenType;
        this.token = token;
        this.roles = roles;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
