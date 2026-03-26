package com.agms.sensor.controller;

import com.agms.sensor.dto.TelemetryEvent;
import com.agms.sensor.service.SensorTelemetryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sensors")
public class SensorTelemetryController {

    private final SensorTelemetryService sensorTelemetryService;

    public SensorTelemetryController(SensorTelemetryService sensorTelemetryService) {
        this.sensorTelemetryService = sensorTelemetryService;
    }

    @GetMapping("/latest")
    public TelemetryEvent latest() {
        return sensorTelemetryService.getLatest();
    }
}
