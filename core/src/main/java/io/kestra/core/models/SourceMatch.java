package io.kestra.core.models;

/**
 * A single occurrence of a source-search query within a flow's YAML source.
 *
 * @param line the 1-based line number where the match starts.
 * @param snippet the full line text with the matched portion wrapped in {@code [mark]}/{@code [/mark]} markers.
 */
public record SourceMatch(int line, String snippet) {
}
