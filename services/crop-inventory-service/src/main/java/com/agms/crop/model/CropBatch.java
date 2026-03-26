package com.agms.crop.model;

import java.time.Instant;

public class CropBatch {
    private String id;
    private String cropName;
    private int quantity;
    private CropStatus status;
    private Instant createdAt;

    public CropBatch() {
    }

    public CropBatch(String id, String cropName, int quantity, CropStatus status, Instant createdAt) {
        this.id = id;
        this.cropName = cropName;
        this.quantity = quantity;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public CropStatus getStatus() {
        return status;
    }

    public void setStatus(CropStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
