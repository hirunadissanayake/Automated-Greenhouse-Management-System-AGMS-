package com.agms.crop.dto;

import com.agms.crop.model.CropStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateCropStatusRequest {
    @NotNull
    private CropStatus status;

    public CropStatus getStatus() {
        return status;
    }

    public void setStatus(CropStatus status) {
        this.status = status;
    }
}
