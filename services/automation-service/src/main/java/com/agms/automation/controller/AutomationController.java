package com.agms.automation.controller;

import com.agms.automation.dto.TelemetryEventRequest;
import com.agms.automation.model.AutomationActionLog;
import com.agms.automation.service.AutomationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/automation")
public class AutomationController {

    private final AutomationService automationService;

    public AutomationController(AutomationService automationService) {
        this.automationService = automationService;
    }

    @PostMapping("/process")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void process(@Valid @RequestBody TelemetryEventRequest request) {
        automationService.process(request);
    }

    @GetMapping("/logs")
    public List<AutomationActionLog> logs() {
        return automationService.getLogs();
    }
}
