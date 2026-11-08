package com.dogmania.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class AgentOfficeService {
    private static final Pattern EVENT_FILE = Pattern.compile("\\d{13}-[0-9a-f-]{36}\\.json");
    private static final Pattern ID = Pattern.compile("[0-9a-f]{20}");
    private static final Pattern PROFILE = Pattern.compile("[a-z][a-z0-9_-]{0,49}");
    private static final Set<String> TYPES = Set.of("started", "stopped", "ended", "delegated", "working", "contact");
    private static final long HISTORY_WINDOW = Duration.ofHours(24).toMillis();
    private static final long ACTIVITY_WINDOW = Duration.ofMinutes(45).toMillis();

    private final Path journal;
    private final ObjectMapper mapper;
    private final Clock clock;
    private final Map<Path, Optional<Event>> parsed = new HashMap<>();

    @Autowired
    public AgentOfficeService(ObjectMapper mapper, @Value("${dogmania.agent-office.journal}") String journal) {
        this(mapper, Path.of(journal), Clock.systemUTC());
    }

    AgentOfficeService(ObjectMapper mapper, Path journal, Clock clock) {
        this.journal = journal.toAbsolutePath().normalize();
        this.mapper = mapper;
        this.clock = clock;
    }

    public synchronized Snapshot snapshot() throws IOException {
        long now = clock.millis();
        List<Path> files;
        try (var entries = Files.list(journal)) {
            files = entries.filter(path -> EVENT_FILE.matcher(path.getFileName().toString()).matches())
                    .filter(path -> Long.parseLong(path.getFileName().toString().substring(0, 13)) >= now - HISTORY_WINDOW)
                    .sorted(Comparator.reverseOrder())
                    .limit(1500)
                    .toList();
        } catch (NoSuchFileException e) {
            return new Snapshot(List.of(), List.of(), null, now);
        }

        parsed.keySet().retainAll(Set.copyOf(files));
        List<Event> events = files.reversed().stream()
                .map(file -> parsed.computeIfAbsent(file, this::readEvent))
                .flatMap(Optional::stream)
                .filter(event -> event.at() <= now + 5_000)
                .toList();
        Map<String, Agent> agents = new LinkedHashMap<>();
        List<Activity> timeline = new ArrayList<>();
        for (Event event : events) {
            Agent previous = agents.get(event.actor());
            boolean genericProfile = "default".equals(event.profile()) || "orchestrator".equals(event.profile());
            String profile = previous != null && genericProfile ? previous.profile() : event.profile();
            String session = previous != null ? previous.session() : event.session();
            if ("ended".equals(event.type())) {
                agents.replaceAll((id, agent) -> agent.session().equals(event.session()) && agent.working()
                        ? new Agent(agent.id(), agent.session(), agent.profile(), false, event.at())
                        : agent);
            }

            if ("contact".equals(event.type())) {
                // A request for contact does not itself start the recipient's work.
                timeline.add(event.activity());
                continue;
            }

            boolean working = switch (event.type()) {
                case "started", "delegated", "working" -> true;
                default -> false;
            };
            agents.put(event.actor(), new Agent(event.actor(), session, profile, working, event.at()));
            if (!"working".equals(event.type()) || previous == null || !previous.working()) {
                timeline.add(event.activity());
            }
        }

        List<Participant> participants = agents.values().stream()
                .map(agent -> new Participant(agent.id(), agent.profile(),
                        agent.working() && agent.at() >= now - ACTIVITY_WINDOW, agent.at()))
                .toList();
        Long lastEventAt = events.isEmpty() ? null : events.getLast().at();
        return new Snapshot(participants, timeline.reversed().stream().limit(30).toList(), lastEventAt, now);
    }

    private Optional<Event> readEvent(Path file) {
        try {
            if (!Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS) || Files.size(file) > 2048) {
                return Optional.empty();
            }
            Event event = mapper.readValue(Files.readAllBytes(file), Event.class);
            long fileTime = Long.parseLong(file.getFileName().toString().substring(0, 13));
            if (event.at() == fileTime && event.type() != null && TYPES.contains(event.type())
                    && matches(ID, event.session()) && matches(ID, event.actor())
                    && matches(PROFILE, event.profile()) && (event.peer() == null || matches(ID, event.peer()))) {
                return Optional.of(new Event(event.session(), event.actor(), event.profile(), event.type(),
                        event.peer(), event.at(), file.getFileName().toString().substring(14, 50)));
            }
        } catch (IOException e) {
            // An incomplete or expired file must not block the rest of the office.
        }
        return Optional.empty();
    }

    private static boolean matches(Pattern pattern, String value) {
        return value != null && pattern.matcher(value).matches();
    }

    private record Event(String session, String actor, String profile, String type, String peer, long at, String id) {
        Activity activity() {
            return new Activity(id, actor, type, peer, at);
        }
    }

    private record Agent(String id, String session, String profile, boolean working, long at) {}

    public record Participant(String id, String profile, boolean working, long at) {}
    public record Activity(String id, String actor, String type, String peer, long at) {}
    public record Snapshot(List<Participant> participants, List<Activity> activities, Long lastEventAt, long now) {}
}
