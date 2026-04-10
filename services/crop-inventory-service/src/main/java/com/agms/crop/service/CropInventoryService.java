package com.agms.crop.service;

import com.agms.crop.dto.CreateCropRequest;
import com.agms.crop.dto.UpdateCropStatusRequest;
import com.agms.crop.exception.BadRequestException;
import com.agms.crop.exception.NotFoundException;
import com.agms.crop.model.CropBatch;
import com.agms.crop.model.CropStatus;
import com.agms.crop.repository.CropBatchRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CropInventoryService {

    private final CropBatchRepository cropBatchRepository;

    public CropInventoryService(CropBatchRepository cropBatchRepository) {
        this.cropBatchRepository = cropBatchRepository;
    }

    public CropBatch create(CreateCropRequest request) {
        CropBatch batch = new CropBatch(
                UUID.randomUUID().toString(),
                request.getCropName(),
                request.getQuantity(),
                CropStatus.SEEDLING,
                Instant.now());

        return cropBatchRepository.save(batch);
    }

    public CropBatch updateStatus(String id, UpdateCropStatusRequest request) {
        CropBatch existing = cropBatchRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Crop batch not found: " + id));

        CropStatus current = existing.getStatus();
        CropStatus next = request.getStatus();
        if (!isValidTransition(current, next)) {
            throw new BadRequestException("Invalid crop lifecycle transition: " + current + " -> " + next);
        }

        existing.setStatus(request.getStatus());
        return cropBatchRepository.save(existing);
    }

    public List<CropBatch> list() {
        return cropBatchRepository.findAllByOrderByCreatedAtDesc();
    }

    private boolean isValidTransition(CropStatus current, CropStatus next) {
        if (current == next) {
            return true;
        }

        return switch (current) {
            case SEEDLING -> next == CropStatus.VEGETATIVE;
            case VEGETATIVE -> next == CropStatus.HARVESTED;
            case HARVESTED -> false;
        };
    }
}
