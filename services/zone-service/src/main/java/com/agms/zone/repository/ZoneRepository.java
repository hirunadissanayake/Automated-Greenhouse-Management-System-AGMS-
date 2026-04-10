package com.agms.zone.repository;

import com.agms.zone.model.Zone;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZoneRepository extends JpaRepository<Zone, String> {
    List<Zone> findAllByOrderByCreatedAtDesc();
}
