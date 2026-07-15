package io.kestra.webserver.models.flows;

import java.util.List;

/**
 * Preview of a Source Search replace-all operation: the matched lines and their proposed
 * replacement, grouped by flow, without anything persisted yet.
 */
public record SourceSearchReplacePreviewResponse(
    int totalMatches,
    int totalFlows,
    int editableFlowCount,
    List<FlowMatches> flows
) {
    public record FlowMatches(String namespace, String id, boolean editable, List<Match> matches) {
    }

    public record Match(int line, String before, String after) {
    }
}
