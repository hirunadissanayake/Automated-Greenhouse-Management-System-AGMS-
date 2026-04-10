package com.agms.iot.repository;

import com.agms.iot.model.Device;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, String> {
    Page<Device> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
