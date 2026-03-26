package com.agms.zone.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateZoneRequest {
    @NotBlank
    private String name;

    private double minTemp;
    private double maxTemp;

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
}
