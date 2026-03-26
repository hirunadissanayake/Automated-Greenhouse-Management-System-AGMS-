package com.agms.automation.model;

import java.time.Instant;

public class AutomationActionLog {
    private String zoneId;
    private String deviceId;
    private String action;
    private double temperature;
    private Instant capturedAt;

    public AutomationActionLog() {
    }

    public AutomationActionLog(String zoneId, String deviceId, String action, double temperature, Instant capturedAt) {
        this.zoneId = zoneId;
        this.deviceId = deviceId;
        this.action = action;
        this.temperature = temperature;
        this.capturedAt = capturedAt;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(Instant capturedAt) {
        this.capturedAt = capturedAt;
    }
}
