package io.kestra.core.models;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class SearchResult<T> {
    T model;
    List<SourceMatch> matches;
    /**
     * Whether the current user is allowed to edit {@link #model}. OSS has no per-flow RBAC so this
     * is always {@code true}; EE overrides the producing service to reflect real permissions.
     */
    boolean editable;
}
