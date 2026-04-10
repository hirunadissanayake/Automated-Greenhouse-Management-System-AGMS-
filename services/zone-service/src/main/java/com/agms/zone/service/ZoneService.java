package com.agms.zone.service;

import com.agms.zone.dto.CreateZoneRequest;
import com.agms.zone.dto.UpdateZoneRequest;
import com.agms.zone.exception.BadRequestException;
import com.agms.zone.exception.NotFoundException;
import com.agms.zone.integration.ExternalIotDeviceClient;
import com.agms.zone.model.Zone;
import com.agms.zone.repository.ZoneRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ZoneService {

    private final ZoneRepository zoneRepository;
    private final ExternalIotDeviceClient externalIotDeviceClient;

    public ZoneService(ZoneRepository zoneRepository, ExternalIotDeviceClient externalIotDeviceClient) {
        this.zoneRepository = zoneRepository;
        this.externalIotDeviceClient = externalIotDeviceClient;
    }

    public Zone create(CreateZoneRequest request) {
        validateThresholds(request.getMinTemp(), request.getMaxTemp());

        String zoneId = UUID.randomUUID().toString();
        String deviceId = null;
        try {
            deviceId = externalIotDeviceClient.createDevice(zoneId, request.getName());
        } catch (RuntimeException ignored) {
            // Keep zone creation available even when the external IoT API is unavailable.
        }

        Zone zone = new Zone(
                zoneId,
                request.getName(),
                request.getMinTemp(),
                request.getMaxTemp(),
                deviceId,
                Instant.now());

        return zoneRepository.save(zone);
    }

    public Zone findById(String id) {
        return zoneRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Zone not found: " + id));
    }

    public List<Zone> list() {
        return zoneRepository.findAllByOrderByCreatedAtDesc();
    }

    public Zone update(String id, UpdateZoneRequest request) {
        validateThresholds(request.getMinTemp(), request.getMaxTemp());
        Zone existing = findById(id);
        existing.setName(request.getName());
        existing.setMinTemp(request.getMinTemp());
        existing.setMaxTemp(request.getMaxTemp());
        return zoneRepository.save(existing);
    }

    public void delete(String id) {
        if (!zoneRepository.existsById(id)) {
            throw new NotFoundException("Zone not found: " + id);
        }
        zoneRepository.deleteById(id);
    }

    private void validateThresholds(double minTemp, double maxTemp) {
        if (minTemp >= maxTemp) {
            throw new BadRequestException("minTemp must be strictly less than maxTemp");
        }
    }
}
