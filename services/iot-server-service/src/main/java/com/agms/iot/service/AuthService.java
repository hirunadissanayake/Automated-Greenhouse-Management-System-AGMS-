package com.agms.iot.service;

import com.agms.iot.dto.AuthRequest;
import com.agms.iot.dto.AuthResponse;
import com.agms.iot.model.UserAccount;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final Map<String, UserAccount> usersByUsername = new ConcurrentHashMap<>();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService;

    @Value("${agms.iot.seed-user.username:agms_user}")
    private String seedUsername;

    @Value("${agms.iot.seed-user.password:123456}")
    private String seedPassword;

    public AuthService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostConstruct
    public void createSeedUser() {
        if (!usersByUsername.containsKey(seedUsername)) {
            UserAccount seed = new UserAccount();
            seed.setUserId(UUID.randomUUID().toString());
            seed.setUsername(seedUsername);
            seed.setPassword(passwordEncoder.encode(seedPassword));
            usersByUsername.put(seed.getUsername(), seed);
        }
    }

    public AuthResponse register(AuthRequest request) {
        if (usersByUsername.containsKey(request.getUsername())) {
            throw new IllegalArgumentException("User already exists");
        }

        UserAccount user = new UserAccount();
        user.setUserId(UUID.randomUUID().toString());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        usersByUsername.put(user.getUsername(), user);

        return buildResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        UserAccount user = usersByUsername.get(request.getUsername());
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        return buildResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.validate(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String userId = jwtService.extractUserId(refreshToken);
        String username = jwtService.extractSubject(refreshToken);
        UserAccount user = usersByUsername.get(username);
        if (user == null || userId == null || !user.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        return buildResponse(user);
    }

    private AuthResponse buildResponse(UserAccount user) {
        AuthResponse response = new AuthResponse();
        response.setUserId(user.getUserId());
        response.setUsername(user.getUsername());
        response.setAccessToken(jwtService.generateAccessToken(user.getUserId(), user.getUsername()));
        response.setRefreshToken(jwtService.generateRefreshToken(user.getUserId(), user.getUsername()));
        return response;
    }
}
