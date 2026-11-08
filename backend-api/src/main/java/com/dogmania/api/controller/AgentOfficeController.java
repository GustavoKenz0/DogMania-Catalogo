package com.dogmania.api.controller;

import com.dogmania.api.service.AgentOfficeService;
import com.dogmania.api.service.AgentOfficeService.Snapshot;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/admin/agent-office")
public class AgentOfficeController {
    private final AgentOfficeService office;

    public AgentOfficeController(AgentOfficeService office) {
        this.office = office;
    }

    @GetMapping
    public ResponseEntity<Snapshot> snapshot() {
        try {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(office.snapshot());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "A Sala dos Agentes está indisponível.");
        }
    }
}
