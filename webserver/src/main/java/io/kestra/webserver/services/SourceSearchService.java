package io.kestra.webserver.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.kestra.core.exceptions.FlowProcessingException;
import io.kestra.core.models.SearchResult;
import io.kestra.core.models.SourceMatch;
import io.kestra.core.models.flows.Flow;
import io.kestra.core.models.flows.FlowInterface;
import io.kestra.core.models.flows.FlowWithSource;
import io.kestra.core.models.flows.GenericFlow;
import io.kestra.core.models.flows.SourceSearchScope;
import io.kestra.core.queues.QueueException;
import io.kestra.core.repositories.ArrayListTotal;
import io.kestra.core.repositories.FlowRepositoryInterface;
import io.kestra.core.services.FlowService;
import io.kestra.core.utils.RegexUtils;
import io.kestra.core.utils.SourceSearchMatcher;
import io.kestra.webserver.controllers.domain.IdWithNamespace;
import io.kestra.webserver.models.flows.SourceSearchReplaceApplyResponse;
import io.kestra.webserver.models.flows.SourceSearchReplacePreviewResponse;
import io.kestra.webserver.models.flows.SourceSearchResult;

import io.micronaut.core.annotation.Nullable;
import io.micronaut.data.model.Pageable;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;

@Singleton
public class SourceSearchService {

    private final FlowRepositoryInterface flowRepository;
    private final FlowService flowService;

    @Inject
    public SourceSearchService(FlowRepositoryInterface flowRepository, FlowService flowService) {
        this.flowRepository = Objects.requireNonNull(flowRepository);
        this.flowService = Objects.requireNonNull(flowService);
    }

    public ArrayListTotal<SourceSearchResult> search(
        Pageable pageable,
        String tenantId,
        @Nullable String namespace,
        @Nullable String query,
        boolean caseSensitive,
        boolean wholeWord,
        boolean regex,
        SourceSearchScope scope
    ) {
        return flowRepository
            .findSourceCode(pageable, query, caseSensitive, wholeWord, regex, scope, tenantId, namespace)
            .map(result -> new SourceSearchResult(
                result.getModel().getNamespace(),
                result.getModel().getId(),
                isEditable(result.getModel()),
                result.getMatches()
            ));
    }

    public SourceSearchReplacePreviewResponse preview(
        String tenantId,
        @Nullable String namespace,
        String query,
        boolean caseSensitive,
        boolean wholeWord,
        boolean regex,
        SourceSearchScope scope,
        String replacement
    ) {
        List<SearchResult<Flow>> matched = flowRepository.findSourceCode(Pageable.UNPAGED, query, caseSensitive, wholeWord, regex, scope, tenantId, namespace);
        Pattern pattern = SourceSearchMatcher.toPattern(query, caseSensitive, wholeWord, regex);
        String effectiveReplacement = regex ? replacement : Matcher.quoteReplacement(replacement);

        List<SourceSearchReplacePreviewResponse.FlowMatches> flows = new ArrayList<>(matched.size());
        int totalMatches = 0;
        int editableFlowCount = 0;
        for (SearchResult<Flow> result : matched) {
            boolean editable = isEditable(result.getModel());
            List<SourceSearchReplacePreviewResponse.Match> matches = replacementMatches(result.getMatches(), pattern, effectiveReplacement);
            flows.add(new SourceSearchReplacePreviewResponse.FlowMatches(result.getModel().getNamespace(), result.getModel().getId(), editable, matches));
            totalMatches += matches.size();
            if (editable) {
                editableFlowCount++;
            }
        }

        return new SourceSearchReplacePreviewResponse(totalMatches, flows.size(), editableFlowCount, flows);
    }

    public SourceSearchReplaceApplyResponse apply(
        String tenantId,
        String query,
        boolean caseSensitive,
        boolean wholeWord,
        boolean regex,
        SourceSearchScope scope,
        String replacement,
        List<IdWithNamespace> selection
    ) throws FlowProcessingException, QueueException {
        Pattern pattern = SourceSearchMatcher.toPattern(query, caseSensitive, wholeWord, regex);
        String effectiveReplacement = regex ? replacement : Matcher.quoteReplacement(replacement);

        List<FlowWithSource> updated = new ArrayList<>();
        List<IdWithNamespace> skipped = new ArrayList<>();

        for (IdWithNamespace ref : selection) {
            Optional<FlowWithSource> existing = flowRepository.findByIdWithSource(tenantId, ref.getNamespace(), ref.getId());
            if (existing.isEmpty() || !isEditable(existing.get())) {
                skipped.add(ref);
                continue;
            }

            FlowWithSource current = existing.get();
            String newSource = SourceSearchMatcher.replaceWithinScope(current.getSource(), pattern, effectiveReplacement, scope);
            if (newSource.equals(current.getSource())) {
                skipped.add(ref);
                continue;
            }

            GenericFlow genericFlow = GenericFlow.fromYaml(tenantId, newSource);
            updated.add(flowService.update(genericFlow, current));
        }

        return new SourceSearchReplaceApplyResponse(updated, skipped);
    }

    protected boolean isEditable(FlowInterface flow) {
        return true;
    }

    private static List<SourceSearchReplacePreviewResponse.Match> replacementMatches(
        List<SourceMatch> matches,
        Pattern pattern,
        String effectiveReplacement
    ) {
        return matches.stream()
            .map(match -> {
                String before = stripMarkers(match.snippet());
                String after = RegexUtils.matcher(pattern, before).replaceAll(effectiveReplacement);
                return new SourceSearchReplacePreviewResponse.Match(match.line(), before, after);
            })
            .toList();
    }

    private static String stripMarkers(String snippet) {
        return snippet.replace("[mark]", "").replace("[/mark]", "");
    }
}
