package com.agms.automation.repository;

import com.agms.automation.model.AutomationActionLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AutomationActionLogRepository extends JpaRepository<AutomationActionLog, Long> {
    List<AutomationActionLog> findAllByOrderByCapturedAtDesc();
}
