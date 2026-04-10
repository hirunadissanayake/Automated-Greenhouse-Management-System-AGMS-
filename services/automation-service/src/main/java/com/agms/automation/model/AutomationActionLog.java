package com.agms.automation.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "automation_logs")
public class AutomationActionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "zone_id", nullable = false, length = 36)
    private String zoneId;

    @Column(name = "device_id", nullable = false, length = 36)
    private String deviceId;

    @Column(name = "action", nullable = false, length = 60)
    private String action;

    @Column(name = "temperature", nullable = false)
    private double temperature;

    @Column(name = "captured_at", nullable = false)
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
