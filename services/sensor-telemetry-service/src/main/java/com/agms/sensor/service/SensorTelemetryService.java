package com.agms.sensor.service;

import com.agms.sensor.config.ExternalIotProperties;
import com.agms.sensor.dto.TelemetryEvent;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
public class SensorTelemetryService {

    private final RestTemplate restTemplate;
    private final ExternalIotProperties iotProperties;
    private final String automationServiceBaseUrl;
    private final AtomicReference<TelemetryEvent> latest = new AtomicReference<>();
    private String accessToken;

    public SensorTelemetryService(RestTemplate restTemplate,
                                  ExternalIotProperties iotProperties,
                                  @Value("${agms.automation-service.base-url:http://localhost:8083}") String automationServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.iotProperties = iotProperties;
        this.automationServiceBaseUrl = automationServiceBaseUrl;
    }

    @Scheduled(fixedRate = 10000)
    public synchronized void fetchAndPushTelemetry() {
        try {
            List<Map<String, Object>> devices = fetchDevices();
            for (Map<String, Object> device : devices) {
                String deviceId = String.valueOf(device.get("deviceId"));
                TelemetryEvent telemetryEvent = fetchDeviceTelemetry(deviceId);
                if (telemetryEvent != null) {
                    latest.set(telemetryEvent);
                    restTemplate.postForEntity(
                            automationServiceBaseUrl + "/api/automation/process",
                            telemetryEvent,
                            Void.class);
                }
            }
        } catch (Exception ignored) {
            // Keep scheduler running even if one polling cycle fails.
        }
    }

    public TelemetryEvent getLatest() {
        return latest.get();
    }

    private List<Map<String, Object>> fetchDevices() {
        ensureLoggedIn();
        Map[] devices;
        try {
            devices = doFetchDevices();
        } catch (HttpClientErrorException.Unauthorized ex) {
            accessToken = null;
            ensureLoggedIn();
            devices = doFetchDevices();
        }

        if (devices == null) {
            return List.of();
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (Map item : devices) {
            out.add(item);
        }
        return out;
    }

    private TelemetryEvent fetchDeviceTelemetry(String deviceId) {
        ensureLoggedIn();
        Map payload;
        try {
            payload = doFetchDeviceTelemetry(deviceId);
        } catch (HttpClientErrorException.Unauthorized ex) {
            accessToken = null;
            ensureLoggedIn();
            payload = doFetchDeviceTelemetry(deviceId);
        }

        if (payload == null) {
            return null;
        }

        Map value = (Map) payload.get("value");
        TelemetryEvent event = new TelemetryEvent();
        event.setDeviceId(String.valueOf(payload.get("deviceId")));
        event.setZoneId(String.valueOf(payload.get("zoneId")));
        event.setTemperature(Double.parseDouble(String.valueOf(value.get("temperature"))));
        event.setHumidity(Double.parseDouble(String.valueOf(value.get("humidity"))));
        Object capturedAt = payload.get("capturedAt");
        event.setCapturedAt(capturedAt == null ? Instant.now() : Instant.parse(capturedAt.toString()));
        return event;
    }

    private Map[] doFetchDevices() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        return restTemplate
                .exchange(iotProperties.getBaseUrl() + "/devices", org.springframework.http.HttpMethod.GET, request, Map[].class)
                .getBody();
    }

    private Map doFetchDeviceTelemetry(String deviceId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        return restTemplate
                .exchange(iotProperties.getBaseUrl() + "/devices/telemetry/" + deviceId,
                        org.springframework.http.HttpMethod.GET,
                        request,
                        Map.class)
                .getBody();
    }

    private void ensureLoggedIn() {
        if (accessToken == null || accessToken.isBlank()) {
            login();
        }
    }

    private void login() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "username", iotProperties.getUsername(),
                "password", iotProperties.getPassword());

        Map response = restTemplate.postForObject(
                iotProperties.getBaseUrl() + "/auth/login",
                new HttpEntity<>(body, headers),
                Map.class);

        if (response == null || response.get("accessToken") == null) {
            throw new IllegalStateException("Unable to authenticate against external IoT API");
        }

        accessToken = response.get("accessToken").toString();
    }
}
