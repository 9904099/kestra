package io.kestra.webserver.services;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import jakarta.validation.ConstraintViolationException;

import io.kestra.core.models.flows.FlowInterface;
import io.kestra.core.models.flows.FlowWithSource;
import io.kestra.core.models.flows.GenericFlow;
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

        SourceSearchReplaceApplyResponse response = service.apply(
            tenantId, "legacy-value", false, false, false, null, "new-value", List.of(ref)
        );

        assertThat(response.updated()).isEmpty();
        assertThat(response.skipped()).containsExactly(ref);
        verify(flowService, never()).update(any(), any());
    }

    @Test
    void shouldSkipFlowsNotFoundWhenApplyingReplace() throws Exception {
        String tenantId = "main";
        IdWithNamespace ref = new IdWithNamespace("io.kestra.tests", "missing-flow");
        when(flowRepository.findByIdWithSource(tenantId, ref.getNamespace(), ref.getId())).thenReturn(Optional.empty());

        SourceSearchService service = new SourceSearchService(flowRepository, flowService);

        SourceSearchReplaceApplyResponse response = service.apply(
            tenantId, "legacy-value", false, false, false, null, "new-value", List.of(ref)
        );

        assertThat(response.updated()).isEmpty();
        assertThat(response.skipped()).containsExactly(ref);
        verify(flowService, never()).update(any(), any());
    }

    @Test
    void shouldSkipFlowsThatFailToSaveWhenApplyingReplace() throws Exception {
        String tenantId = "main";
        IdWithNamespace ref = new IdWithNamespace("io.kestra.tests", "unsavable-flow");
        FlowWithSource flow = FlowWithSource.builder()
            .tenantId(tenantId)
            .namespace(ref.getNamespace())
            .id(ref.getId())
            .source("id: unsavable-flow\nnamespace: io.kestra.tests\ntasks:\n  - id: log\n    type: io.kestra.plugin.core.log.Log\n    message: legacy-value\n")
            .build();
        when(flowRepository.findByIdWithSource(tenantId, ref.getNamespace(), ref.getId())).thenReturn(Optional.of(flow));
        when(flowService.update(any(), any())).thenThrow(new ConstraintViolationException("Invalid type", Set.of()));

        SourceSearchService service = new SourceSearchService(flowRepository, flowService);

        SourceSearchReplaceApplyResponse response = service.apply(
            tenantId, "legacy-value", false, false, false, null, "new-value", List.of(ref)
        );

        assertThat(response.updated()).isEmpty();
        assertThat(response.skipped()).containsExactly(ref);
    }

    @Test
    void shouldReplaceOnlyTheTargetLineWhenApplyingLineReplace() throws Exception {
        String tenantId = "main";
        FlowWithSource flow = FlowWithSource.builder()
            .tenantId(tenantId)
            .namespace("io.kestra.tests")
            .id("multi")
            .source("id: multi\nnamespace: io.kestra.tests\ntasks:\n  - id: a\n    type: io.kestra.plugin.core.log.Log\n    message: legacy-value\n  - id: b\n    type: io.kestra.plugin.core.log.Log\n    message: legacy-value\n")
            .build();
        when(flowRepository.findByIdWithSource(tenantId, "io.kestra.tests", "multi")).thenReturn(Optional.of(flow));
        when(flowService.update(any(), any())).thenReturn(flow);

        SourceSearchService service = new SourceSearchService(flowRepository, flowService);

        service.applyLine(tenantId, "legacy-value", false, false, false, "new-value", "io.kestra.tests", "multi", 6);

        ArgumentCaptor<GenericFlow> captor = ArgumentCaptor.forClass(GenericFlow.class);
        verify(flowService).update(captor.capture(), any());
        String saved = captor.getValue().getSource();
        assertThat(saved).contains("    message: new-value\n");
        assertThat(saved).contains("    message: legacy-value\n");
    }
}
