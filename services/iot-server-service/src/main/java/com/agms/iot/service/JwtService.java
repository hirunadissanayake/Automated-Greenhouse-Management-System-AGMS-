package com.agms.iot.service;

import com.agms.iot.config.JwtProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(String userId, String username) {
        return generate(userId, username, jwtProperties.getAccessExpirationSeconds());
    }

    public String generateRefreshToken(String userId, String username) {
        return generate(userId, username, jwtProperties.getRefreshExpirationSeconds());
    }

    public boolean validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String data = parts[0] + "." + parts[1];
            String expectedSignature = sign(data);
            if (!expectedSignature.equals(parts[2])) {
                return false;
            }

            JsonNode payload = decodePayload(parts[1]);
            JsonNode expNode = payload.get("exp");
            return expNode != null && Instant.now().getEpochSecond() < expNode.asLong();
        } catch (Exception ex) {
            return false;
        }
    }

    public String extractSubject(String token) {
        return extractClaim(token, "sub");
    }

    public String extractUserId(String token) {
        return extractClaim(token, "userId");
    }

    private String generate(String userId, String username, long expirationSeconds) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + expirationSeconds;

            String headerJson = objectMapper.writeValueAsString(Map.of("alg", "HS256", "typ", "JWT"));
            String payloadJson = objectMapper.writeValueAsString(Map.of(
                    "sub", username,
                    "userId", userId,
                    "iat", now,
                    "exp", exp,
                    "role", "USER"));

            String header = base64Url(headerJson);
            String payload = base64Url(payloadJson);
            String signature = sign(header + "." + payload);

            return header + "." + payload + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate JWT token", ex);
        }
    }

    private String extractClaim(String token, String claimName) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            JsonNode payload = decodePayload(parts[1]);
            JsonNode claim = payload.get(claimName);
            return claim == null ? null : claim.asText();
        } catch (Exception ex) {
            return null;
        }
    }

    private JsonNode decodePayload(String payload) throws Exception {
        byte[] decoded = Base64.getUrlDecoder().decode(payload);
        return objectMapper.readTree(new String(decoded, StandardCharsets.UTF_8));
    }

    private String sign(String data) throws Exception {
        Mac sha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256.init(secretKey);
        byte[] signature = sha256.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
    }

    private String base64Url(String content) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(content.getBytes(StandardCharsets.UTF_8));
    }
}
