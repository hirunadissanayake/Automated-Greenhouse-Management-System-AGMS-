package com.agms.crop.service;

import com.agms.crop.dto.CreateCropRequest;
import com.agms.crop.dto.UpdateCropStatusRequest;
import com.agms.crop.exception.NotFoundException;
import com.agms.crop.model.CropBatch;
import com.agms.crop.model.CropStatus;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class CropInventoryService {

    private final Map<String, CropBatch> batches = new ConcurrentHashMap<>();

    public CropBatch create(CreateCropRequest request) {
        CropBatch batch = new CropBatch(
                UUID.randomUUID().toString(),
                request.getCropName(),
                request.getQuantity(),
                CropStatus.SEEDLING,
                Instant.now());

        batches.put(batch.getId(), batch);
        return batch;
    }

    public CropBatch updateStatus(String id, UpdateCropStatusRequest request) {
        CropBatch existing = batches.get(id);
        if (existing == null) {
            throw new NotFoundException("Crop batch not found: " + id);
        }
        existing.setStatus(request.getStatus());
        return existing;
    }

    public List<CropBatch> list() {
        return batches.values().stream().toList();
    }
}
