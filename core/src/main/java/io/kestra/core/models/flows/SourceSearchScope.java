package io.kestra.core.models.flows;

import com.fasterxml.jackson.annotation.JsonCreator;

import io.kestra.core.utils.Enums;

/**
 * Restricts a Source Search query to a specific top-level section of the flow YAML.
 */
public enum SourceSearchScope {
    ALL,
    TASKS,
    TRIGGERS,
    INPUTS;

    /**
     * Falls back to {@link #ALL} rather than an {@code UNKNOWN} value: this is a UI-facing search
     * scope with a safe, sensible default, not a persisted/plugin type that needs to round-trip an
     * unrecognized value.
     */
    @JsonCreator
    public static SourceSearchScope fromString(final String value) {
        return Enums.getForNameIgnoreCase(value, SourceSearchScope.class, ALL);
    }
}
