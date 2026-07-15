package io.kestra.webserver.models.flows;

import java.util.List;

import io.kestra.core.models.flows.FlowWithSource;
import io.kestra.webserver.controllers.domain.IdWithNamespace;

/**
 * Outcome of a Source Search replace-all apply: the flows that were updated, and those skipped
 * because the caller is not allowed to edit them.
 */
public record SourceSearchReplaceApplyResponse(List<FlowWithSource> updated, List<IdWithNamespace> skipped) {
}
