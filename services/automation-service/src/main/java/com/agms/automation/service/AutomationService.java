package com.agms.automation.service;

import com.agms.automation.dto.TelemetryEventRequest;
import com.agms.automation.dto.ZoneThresholdResponse;
import com.agms.automation.model.AutomationActionLog;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AutomationService {

    private final RestTemplate restTemplate;
    private final String zoneServiceBaseUrl;
    private final List<AutomationActionLog> logs = new ArrayList<>();

    public AutomationService(RestTemplate restTemplate,
                             @Value("${agms.zone-service.base-url:http://localhost:8081}") String zoneServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.zoneServiceBaseUrl = zoneServiceBaseUrl;
    }

    public void process(TelemetryEventRequest event) {
        ZoneThresholdResponse zone = restTemplate.getForObject(
                zoneServiceBaseUrl + "/api/zones/" + event.getZoneId(),
                ZoneThresholdResponse.class);

        if (zone == null) {
            return;
        }

        if (event.getTemperature() > zone.getMaxTemp()) {
            logs.add(new AutomationActionLog(
                    event.getZoneId(),
                    event.getDeviceId(),
                    "TURN_FAN_ON",
                    event.getTemperature(),
                    event.getCapturedAt() == null ? Instant.now() : event.getCapturedAt()));
        }

        if (event.getTemperature() < zone.getMinTemp()) {
            logs.add(new AutomationActionLog(
                    event.getZoneId(),
                    event.getDeviceId(),
                    "TURN_HEATER_ON",
                    event.getTemperature(),
                    event.getCapturedAt() == null ? Instant.now() : event.getCapturedAt()));
        }
    }

    public List<AutomationActionLog> getLogs() {
        return List.copyOf(logs);
    }
}
