package com.agms.automation.service;

import com.agms.automation.client.ZoneServiceClient;
import com.agms.automation.dto.TelemetryEventRequest;
import com.agms.automation.dto.ZoneThresholdResponse;
import com.agms.automation.model.AutomationActionLog;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AutomationService {

    private final ZoneServiceClient zoneServiceClient;
    private final List<AutomationActionLog> logs = new ArrayList<>();

    public AutomationService(ZoneServiceClient zoneServiceClient) {
        this.zoneServiceClient = zoneServiceClient;
    }

    public void process(TelemetryEventRequest event) {
        ZoneThresholdResponse zone = zoneServiceClient.getZoneById(event.getZoneId());

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
