package com.agms.iot.controller;

import com.agms.iot.dto.DeviceRequest;
import com.agms.iot.dto.DeviceResponse;
import com.agms.iot.dto.TelemetryResponse;
import com.agms.iot.security.AuthenticatedUser;
import com.agms.iot.service.DeviceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping
    public ResponseEntity<DeviceResponse> create(@Valid @RequestBody DeviceRequest request, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(deviceService.create(user.userId(), request));
    }

    @GetMapping
    public ResponseEntity<List<DeviceResponse>> list(Authentication authentication,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(deviceService.listByUser(user.userId(), page, size));
    }

    @GetMapping("/telemetry/{deviceId}")
    public ResponseEntity<TelemetryResponse> telemetry(@PathVariable String deviceId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(deviceService.refreshAndGet(user.userId(), deviceId));
    }
}
