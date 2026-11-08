package com.dogmania.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AgentOfficeServiceTest {
    private static final String MAIN = "a".repeat(20);
    private static final String TESTER = "b".repeat(20);
    private static final String BACKEND = "c".repeat(20);
    private static final Instant NOW = Instant.parse("2026-11-06T15:00:00Z");
    @TempDir Path directory;

    @Test
    void tracksWorkContactAndRestWithoutRetainingRepeatedHeartbeats() throws IOException {
        write(5_000, MAIN, "orchestrator", "started", null);
        write(4_000, TESTER, "qa-sdet", "delegated", MAIN);
        write(3_000, TESTER, "default", "working", null);
        write(2_000, MAIN, "orchestrator", "contact", TESTER);
        var office = office();
        var active = office.snapshot();
        assertThat(active.participants()).allMatch(AgentOfficeService.Participant::working);
        assertThat(active.activities()).extracting(AgentOfficeService.Activity::type)
                .containsExactly("contact", "delegated", "started");

        write(1_000, TESTER, "default", "stopped", null);
        var rested = office.snapshot();
        assertThat(rested.participants()).anyMatch(agent -> agent.id().equals(TESTER)
                && agent.profile().equals("qa-sdet") && !agent.working());
        assertThat(rested.participants()).anyMatch(agent -> agent.id().equals(MAIN) && agent.working());
    }

    @Test
    void expiresStaleActivityAndClosesSubagentsOnSessionEnd() throws IOException {
        write(60 * 60_000, TESTER, "qa-sdet", "delegated", MAIN);
        write(15_000, BACKEND, "backend", "delegated", MAIN);
        Files.writeString(directory.resolve(NOW.toEpochMilli() + "-" + UUID.randomUUID() + ".json"), "{}");
        var office = office();
        assertThat(office.snapshot().participants()).hasSize(2)
                .anyMatch(agent -> agent.id().equals(TESTER) && !agent.working())
                .anyMatch(agent -> agent.id().equals(BACKEND) && agent.working());

        write(500, MAIN, "orchestrator", "ended", null);
        assertThat(office.snapshot().participants()).noneMatch(AgentOfficeService.Participant::working);
    }

    private AgentOfficeService office() {
        return new AgentOfficeService(new ObjectMapper(), directory, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private void write(long millisecondsAgo, String actor, String profile, String type, String peer) throws IOException {
        long at = NOW.toEpochMilli() - millisecondsAgo;
        var entry = new ObjectMapper().createObjectNode()
                .put("session", MAIN).put("actor", actor).put("profile", profile).put("type", type).put("at", at);
        if (peer != null) entry.put("peer", peer);
        Files.writeString(directory.resolve(at + "-" + UUID.randomUUID() + ".json"), entry.toString());
    }
}
