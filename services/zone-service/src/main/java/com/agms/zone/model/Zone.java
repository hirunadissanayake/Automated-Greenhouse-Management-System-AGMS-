package com.agms.zone.model;

import java.time.Instant;

public class Zone {
    private String id;
    private String name;
    private double minTemp;
    private double maxTemp;
    private String deviceId;
    private Instant createdAt;

    public Zone() {
    }

    public Zone(String id, String name, double minTemp, double maxTemp, String deviceId, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.deviceId = deviceId;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getMinTemp() {
        return minTemp;
    }

    public void setMinTemp(double minTemp) {
        this.minTemp = minTemp;
    }

    public double getMaxTemp() {
        return maxTemp;
    }

    public void setMaxTemp(double maxTemp) {
        this.maxTemp = maxTemp;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
