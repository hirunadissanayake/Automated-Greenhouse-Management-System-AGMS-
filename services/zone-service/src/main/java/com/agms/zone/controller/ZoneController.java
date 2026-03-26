package com.agms.zone.controller;

import com.agms.zone.dto.CreateZoneRequest;
import com.agms.zone.dto.UpdateZoneRequest;
import com.agms.zone.model.Zone;
import com.agms.zone.service.ZoneService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final ZoneService zoneService;

    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Zone create(@Valid @RequestBody CreateZoneRequest request) {
        return zoneService.create(request);
    }

    @GetMapping
    public List<Zone> list() {
        return zoneService.list();
    }

    @GetMapping("/{id}")
    public Zone getById(@PathVariable String id) {
        return zoneService.findById(id);
    }

    @PutMapping("/{id}")
    public Zone update(@PathVariable String id, @Valid @RequestBody UpdateZoneRequest request) {
        return zoneService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        zoneService.delete(id);
    }
}
