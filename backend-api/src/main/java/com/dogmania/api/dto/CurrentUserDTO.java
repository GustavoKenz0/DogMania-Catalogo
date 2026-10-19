package com.dogmania.api.dto;

import java.util.UUID;

public record CurrentUserDTO(UUID userId, String name, String email, String role) {}
