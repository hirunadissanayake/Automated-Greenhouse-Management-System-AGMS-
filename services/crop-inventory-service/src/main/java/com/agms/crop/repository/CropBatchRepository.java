package com.agms.crop.repository;

import com.agms.crop.model.CropBatch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CropBatchRepository extends JpaRepository<CropBatch, String> {
    List<CropBatch> findAllByOrderByCreatedAtDesc();
}
