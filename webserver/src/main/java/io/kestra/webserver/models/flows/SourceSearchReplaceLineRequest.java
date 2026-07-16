package io.kestra.webserver.models.flows;

import io.kestra.core.models.flows.SourceSearchScope;

import io.micronaut.core.annotation.Nullable;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SourceSearchReplaceLineRequest(
    @NotBlank String query,
    boolean caseSensitive,
    boolean wholeWord,
    boolean regex,
    @Nullable SourceSearchScope scope,
    @NotNull String replacement,
    @NotBlank String namespace,
    @NotBlank String id,
    @Min(1) int line
) {
}
