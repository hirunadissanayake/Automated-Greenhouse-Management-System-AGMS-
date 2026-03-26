package com.agms.automation.service;

import com.agms.automation.client.ZoneServiceClient;
import com.agms.automation.dto.TelemetryEventRequest;
import com.agms.automation.dto.ZoneThresholdResponse;
import com.agms.automation.exception.BadRequestException;
import com.agms.automation.exception.ServiceUnavailableException;
import com.agms.automation.model.AutomationActionLog;
import feign.FeignException;
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
        ZoneThresholdResponse zone;
        try {
            zone = zoneServiceClient.getZoneById(event.getZoneId());
        } catch (FeignException.NotFound ex) {
            throw new BadRequestException("Zone not found: " + event.getZoneId());
        } catch (FeignException ex) {
            throw new ServiceUnavailableException("Unable to validate zone thresholds right now.");
        }

        if (zone == null) {
            throw new BadRequestException("Zone not found: " + event.getZoneId());
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
