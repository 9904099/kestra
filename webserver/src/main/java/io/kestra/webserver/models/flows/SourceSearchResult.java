package io.kestra.webserver.models.flows;

import java.util.List;

import io.kestra.core.models.SourceMatch;

/**
 * A flow matching a Source Search query, with its highlighted line matches.
 *
 * @param editable whether the current user is allowed to edit this flow. Always {@code true} in OSS.
 */
public record SourceSearchResult(String namespace, String id, boolean editable, List<SourceMatch> matches) {
}
