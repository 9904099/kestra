package io.kestra.webserver.models.flows;

import io.kestra.core.models.flows.SourceSearchScope;

import io.micronaut.core.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request body to preview a Source Search replace-all operation without persisting anything.
 */
public record SourceSearchReplacePreviewRequest(
    @NotBlank String query,
    boolean caseSensitive,
    boolean wholeWord,
    boolean regex,
    @Nullable String namespace,
    @Nullable SourceSearchScope scope,
    @NotNull String replacement
) {
    public SourceSearchScope scopeOrAll() {
        return scope == null ? SourceSearchScope.ALL : scope;
    }
}
