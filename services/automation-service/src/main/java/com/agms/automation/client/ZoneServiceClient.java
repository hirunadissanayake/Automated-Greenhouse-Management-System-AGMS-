package com.agms.automation.client;

import com.agms.automation.dto.ZoneThresholdResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "zone-service", url = "${agms.zone-service.base-url:http://localhost:8081}")
public interface ZoneServiceClient {

    @GetMapping("/api/zones/{id}")
    ZoneThresholdResponse getZoneById(@PathVariable("id") String id);
}
