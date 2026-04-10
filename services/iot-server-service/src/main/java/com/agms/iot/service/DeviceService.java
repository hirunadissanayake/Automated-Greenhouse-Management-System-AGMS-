package com.agms.iot.service;

import com.agms.iot.dto.DeviceRequest;
import com.agms.iot.dto.DeviceResponse;
import com.agms.iot.dto.SensorValueResponse;
import com.agms.iot.dto.TelemetryResponse;
import com.agms.iot.model.Device;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {

    private final Map<String, Device> devicesById = new ConcurrentHashMap<>();
    private final Map<String, TelemetryResponse> telemetryByDeviceId = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public DeviceResponse create(String userId, DeviceRequest request) {
        Device device = new Device();
        device.setDeviceId(UUID.randomUUID().toString());
        device.setName(request.getName());
        device.setZoneId(request.getZoneId());
        device.setUserId(userId);
        device.setCreatedAt(Instant.now());

        devicesById.put(device.getDeviceId(), device);
        telemetryByDeviceId.put(device.getDeviceId(), initialTelemetry(device));

        return toResponse(device);
    }

    public List<DeviceResponse> listByUser(String userId, int page, int size) {
        int fromIndex = page * size;
        List<DeviceResponse> all = devicesById.values().stream()
                .filter(device -> device.getUserId().equals(userId))
                .sorted(Comparator.comparing(Device::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();

        if (fromIndex >= all.size()) {
            return List.of();
        }

        int toIndex = Math.min(fromIndex + size, all.size());
        return new ArrayList<>(all.subList(fromIndex, toIndex));
    }

    public TelemetryResponse refreshAndGet(String userId, String deviceId) {
        Device device = devicesById.get(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Device not found");
        }

        TelemetryResponse previous = telemetryByDeviceId.get(deviceId);
        TelemetryResponse next = nextTelemetry(device, previous);
        telemetryByDeviceId.put(deviceId, next);
        return next;
    }

    private DeviceResponse toResponse(Device device) {
        DeviceResponse response = new DeviceResponse();
        response.setDeviceId(device.getDeviceId());
        response.setName(device.getName());
        response.setZoneId(device.getZoneId());
        response.setUserId(device.getUserId());
        response.setCreateAt(device.getCreatedAt().toString());
        return response;
    }

    private TelemetryResponse initialTelemetry(Device device) {
        TelemetryResponse response = new TelemetryResponse();
        response.setDeviceId(device.getDeviceId());
        response.setZoneId(device.getZoneId());
        response.setCapturedAt(Instant.now().toString());

        SensorValueResponse value = new SensorValueResponse();
        value.setTemperature(24.0);
        value.setTempUnit("CELSIUS");
        value.setHumidity(55.0);
        value.setHumidityUnit("PERCENTAGE");
        response.setValue(value);

        return response;
    }

    private TelemetryResponse nextTelemetry(Device device, TelemetryResponse previous) {
        double currentTemp = previous == null ? 24.0 : previous.getValue().getTemperature();
        double currentHumidity = previous == null ? 55.0 : previous.getValue().getHumidity();

        double nextTemp = Math.round((currentTemp + (random.nextDouble() - 0.5) * 0.6) * 100.0) / 100.0;
        double nextHumidity = Math.round((currentHumidity + (random.nextDouble() - 0.5) * 0.8) * 100.0) / 100.0;

        TelemetryResponse response = new TelemetryResponse();
        response.setDeviceId(device.getDeviceId());
        response.setZoneId(device.getZoneId());
        response.setCapturedAt(Instant.now().toString());

        SensorValueResponse value = new SensorValueResponse();
        value.setTemperature(nextTemp);
        value.setTempUnit("CELSIUS");
        value.setHumidity(nextHumidity);
        value.setHumidityUnit("PERCENTAGE");
        response.setValue(value);

        return response;
    }
}
