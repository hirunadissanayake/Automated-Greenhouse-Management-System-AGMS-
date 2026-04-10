package com.agms.iot.dto;

import jakarta.validation.constraints.NotBlank;

public class DeviceRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String zoneId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }
}
