package com.agms.crop.controller;

import com.agms.crop.dto.CreateCropRequest;
import com.agms.crop.dto.UpdateCropStatusRequest;
import com.agms.crop.model.CropBatch;
import com.agms.crop.service.CropInventoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/crops")
public class CropInventoryController {

    private final CropInventoryService cropInventoryService;

    public CropInventoryController(CropInventoryService cropInventoryService) {
        this.cropInventoryService = cropInventoryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CropBatch create(@Valid @RequestBody CreateCropRequest request) {
        return cropInventoryService.create(request);
    }

    @PutMapping("/{id}/status")
    public CropBatch updateStatus(@PathVariable String id, @Valid @RequestBody UpdateCropStatusRequest request) {
        return cropInventoryService.updateStatus(id, request);
    }

    @GetMapping
    public List<CropBatch> list() {
        return cropInventoryService.list();
    }
}
