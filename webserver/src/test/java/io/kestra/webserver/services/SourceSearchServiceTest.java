package io.kestra.webserver.services;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import io.kestra.core.models.flows.FlowInterface;
import io.kestra.core.models.flows.FlowWithSource;
import io.kestra.core.repositories.FlowRepositoryInterface;
import io.kestra.core.services.FlowService;
import io.kestra.webserver.controllers.domain.IdWithNamespace;
import io.kestra.webserver.models.flows.SourceSearchReplaceApplyResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SourceSearchServiceTest {

    private final FlowRepositoryInterface flowRepository = mock(FlowRepositoryInterface.class);
    private final FlowService flowService = mock(FlowService.class);

    @Test
    void shouldSkipFlowsTheCallerIsNotAllowedToEditWhenApplyingReplace() throws Exception {
        // Given — a flow the isEditable override always denies, mirroring how EE will plug in
        // real FLOW UPDATE permission checks.
        String tenantId = "main";
        IdWithNamespace ref = new IdWithNamespace("io.kestra.tests", "locked-flow");
        FlowWithSource flow = FlowWithSource.builder()
            .tenantId(tenantId)
            .namespace(ref.getNamespace())
            .id(ref.getId())
            .source("id: locked-flow\nnamespace: io.kestra.tests\ndescription: legacy-value here\n")
            .build();
        when(flowRepository.findByIdWithSource(tenantId, ref.getNamespace(), ref.getId())).thenReturn(Optional.of(flow));

        SourceSearchService service = new SourceSearchService(flowRepository, flowService) {
            @Override
            protected boolean isEditable(FlowInterface flow) {
                return false;
            }
        };

        // When
        SourceSearchReplaceApplyResponse response = service.apply(
            tenantId, "legacy-value", false, false, false, null, "new-value", List.of(ref)
        );

        // Then
        assertThat(response.updated()).isEmpty();
        assertThat(response.skipped()).containsExactly(ref);
        verify(flowService, never()).update(any(), any());
    }

    @Test
    void shouldSkipFlowsNotFoundWhenApplyingReplace() throws Exception {
        // Given
        String tenantId = "main";
        IdWithNamespace ref = new IdWithNamespace("io.kestra.tests", "missing-flow");
        when(flowRepository.findByIdWithSource(tenantId, ref.getNamespace(), ref.getId())).thenReturn(Optional.empty());

        SourceSearchService service = new SourceSearchService(flowRepository, flowService);

        // When
        SourceSearchReplaceApplyResponse response = service.apply(
            tenantId, "legacy-value", false, false, false, null, "new-value", List.of(ref)
        );

        // Then
        assertThat(response.updated()).isEmpty();
        assertThat(response.skipped()).containsExactly(ref);
        verify(flowService, never()).update(any(), any());
    }
}
