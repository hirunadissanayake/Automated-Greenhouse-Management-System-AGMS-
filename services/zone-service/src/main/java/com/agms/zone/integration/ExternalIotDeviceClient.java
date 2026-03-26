package com.agms.zone.integration;

import com.agms.zone.config.ExternalIotProperties;
import com.agms.zone.exception.BadRequestException;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ExternalIotDeviceClient {

    private final RestTemplate restTemplate;
    private final ExternalIotProperties properties;
    private String accessToken;

    public ExternalIotDeviceClient(RestTemplate restTemplate, ExternalIotProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public synchronized String createDevice(String zoneId, String zoneName) {
        if (accessToken == null || accessToken.isBlank()) {
            login();
        }

        String url = properties.getBaseUrl() + "/devices";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "name", zoneName + "-sensor",
                "zoneId", zoneId);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
            Map payload = response.getBody();
            if (payload == null || payload.get("deviceId") == null) {
                throw new BadRequestException("External IoT API returned no deviceId");
            }
            return payload.get("deviceId").toString();
        } catch (Exception ex) {
            accessToken = null;
            throw new BadRequestException("Failed to register device in external IoT API: " + ex.getMessage());
        }
    }

    private void login() {
        String url = properties.getBaseUrl() + "/auth/login";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "username", properties.getUsername(),
                "password", properties.getPassword());

        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
        Map payload = response.getBody();
        if (payload == null || payload.get("accessToken") == null) {
            throw new BadRequestException("External IoT login failed: accessToken missing");
        }

        this.accessToken = payload.get("accessToken").toString();
    }
}
