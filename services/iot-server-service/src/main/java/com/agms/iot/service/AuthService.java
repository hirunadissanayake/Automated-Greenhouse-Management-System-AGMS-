package com.agms.iot.service;

import com.agms.iot.dto.AuthRequest;
import com.agms.iot.dto.AuthResponse;
import com.agms.iot.model.UserAccount;
import com.agms.iot.repository.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;

    @Value("${agms.iot.seed-user.username:agms_user}")
    private String seedUsername;

    @Value("${agms.iot.seed-user.password:123456}")
    private String seedPassword;

    public AuthService(JwtService jwtService, UserAccountRepository userAccountRepository) {
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
    }

    @PostConstruct
    public void createSeedUser() {
        if (userAccountRepository.findByUsername(seedUsername).isEmpty()) {
            UserAccount seed = new UserAccount();
            seed.setUserId(UUID.randomUUID().toString());
            seed.setUsername(seedUsername);
            seed.setPassword(passwordEncoder.encode(seedPassword));
            userAccountRepository.save(seed);
        }
    }

    public AuthResponse register(AuthRequest request) {
        if (userAccountRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("User already exists");
        }

        UserAccount user = new UserAccount();
        user.setUserId(UUID.randomUUID().toString());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userAccountRepository.save(user);

        return buildResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        UserAccount user = userAccountRepository.findByUsername(request.getUsername()).orElse(null);
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
        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
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
