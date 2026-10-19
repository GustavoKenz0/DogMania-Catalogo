package com.dogmania.api.security;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/** Per-instance protection. Production gateways must also apply distributed rate limits. */
@Component
public class LoginAttemptLimiter {
    private record Window(long startedAt, int attempts) {}
    private final Map<String, Window> windows = new HashMap<>();
    private static final long WINDOW_MS = Duration.ofMinutes(5).toMillis();

    public synchronized void check(String address) {
        long now = System.currentTimeMillis();
        windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt() >= WINDOW_MS);
        Window current = windows.get(address);
        if (current == null) {
            if (windows.size() >= 10000) throw limited();
            windows.put(address, new Window(now, 1));
        } else {
            if (current.attempts() >= 10) throw limited();
            windows.put(address, new Window(current.startedAt(), current.attempts() + 1));
        }
    }

    private ResponseStatusException limited() {
        return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
    }
}
