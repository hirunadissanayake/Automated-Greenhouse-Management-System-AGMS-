package com.agms.zone.service;

import com.agms.zone.dto.CreateZoneRequest;
import com.agms.zone.dto.UpdateZoneRequest;
import com.agms.zone.exception.BadRequestException;
import com.agms.zone.exception.NotFoundException;
import com.agms.zone.model.Zone;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ZoneService {

    private final Map<String, Zone> zones = new ConcurrentHashMap<>();

    public Zone create(CreateZoneRequest request) {
        validateThresholds(request.getMinTemp(), request.getMaxTemp());

        Zone zone = new Zone(
                UUID.randomUUID().toString(),
                request.getName(),
                request.getMinTemp(),
                request.getMaxTemp(),
                request.getDeviceId(),
                Instant.now());

        zones.put(zone.getId(), zone);
        return zone;
    }

    public Zone findById(String id) {
        Zone zone = zones.get(id);
        if (zone == null) {
            throw new NotFoundException("Zone not found: " + id);
        }
        return zone;
    }

    public Zone update(String id, UpdateZoneRequest request) {
        validateThresholds(request.getMinTemp(), request.getMaxTemp());
        Zone existing = findById(id);
        existing.setName(request.getName());
        existing.setMinTemp(request.getMinTemp());
        existing.setMaxTemp(request.getMaxTemp());
        return existing;
    }

    public void delete(String id) {
        if (zones.remove(id) == null) {
            throw new NotFoundException("Zone not found: " + id);
        }
    }

    private void validateThresholds(double minTemp, double maxTemp) {
        if (minTemp >= maxTemp) {
            throw new BadRequestException("minTemp must be strictly less than maxTemp");
        }
    }
}
