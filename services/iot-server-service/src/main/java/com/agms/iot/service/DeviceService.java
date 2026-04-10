package com.agms.iot.service;

import com.agms.iot.dto.DeviceRequest;
import com.agms.iot.dto.DeviceResponse;
import com.agms.iot.dto.SensorValueResponse;
import com.agms.iot.dto.TelemetryResponse;
import com.agms.iot.model.Device;
import com.agms.iot.repository.DeviceRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final Map<String, TelemetryResponse> telemetryByDeviceId = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public DeviceResponse create(String userId, DeviceRequest request) {
        Device device = new Device();
        device.setDeviceId(UUID.randomUUID().toString());
        device.setName(request.getName());
        device.setZoneId(request.getZoneId());
        device.setUserId(userId);
        device.setCreatedAt(Instant.now());

        deviceRepository.save(device);
        telemetryByDeviceId.put(device.getDeviceId(), initialTelemetry(device));

        return toResponse(device);
    }

    public List<DeviceResponse> listByUser(String userId, int page, int size) {
        return deviceRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TelemetryResponse refreshAndGet(String userId, String deviceId) {
        Device device = deviceRepository.findById(deviceId).orElse(null);
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
