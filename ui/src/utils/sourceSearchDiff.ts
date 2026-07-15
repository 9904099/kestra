export interface SourceSearchSelectionGroup {
    namespace: string;
    id: string;
    editable: boolean;
    matches: {line: number}[];
}

export interface SelectionSummary {
    selectedFlowCount: number;
    selectedMatchCount: number;
}

/**
 * Aggregates how many editable flows/matches are currently checked for a bulk replace, given the
 * search results and the set of checked match keys (`${namespace}.${id}#${line}`).
 */
export function computeSelectionSummary(results: SourceSearchSelectionGroup[], selectedMatchKeys: Set<string>): SelectionSummary {
    let selectedFlowCount = 0
    let selectedMatchCount = 0

    for (const group of results) {
        if (!group.editable) {
            continue
        }
        const checkedCount = group.matches.filter((match) => selectedMatchKeys.has(`${group.namespace}.${group.id}#${match.line}`)).length
        if (checkedCount > 0) {
            selectedFlowCount += 1
            selectedMatchCount += checkedCount
        }
    }

    return {selectedFlowCount, selectedMatchCount}
}

export interface SourceSearchDiffMatch {
    line: number;
    before: string;
    after: string;
}

export interface DiffLine {
    kind: "context" | "removed" | "added";
    line: number;
    text: string;
}

/**
 * Builds a unified-diff-style list of lines around each replace match: a few lines of
 * unchanged context, then the removed/added pair for the match itself. Overlapping or
 * adjacent windows are merged into a single hunk so shared context isn't duplicated.
 */
export function buildDiffHunks(sourceLines: string[], matches: SourceSearchDiffMatch[], context = 2): DiffLine[] {
    if (matches.length === 0) {
        return []
    }

    const sorted = [...matches].sort((a, b) => a.line - b.line)

    const ranges = sorted.map((match) => ({
        start: Math.max(1, match.line - context),
        end: Math.min(sourceLines.length, match.line + context),
        matches: [match],
    }))

    const merged: typeof ranges = []
    for (const range of ranges) {
        const last = merged[merged.length - 1]
        if (last && range.start <= last.end + 1) {
            last.end = Math.max(last.end, range.end)
            last.matches.push(...range.matches)
        } else {
            merged.push(range)
        }
    }

    const lines: DiffLine[] = []
    for (const hunk of merged) {
        for (let line = hunk.start; line <= hunk.end; line++) {
            const match = hunk.matches.find((m) => m.line === line)
            if (match) {
                lines.push({kind: "removed", line, text: match.before})
                lines.push({kind: "added", line, text: match.after})
            } else {
                lines.push({kind: "context", line, text: sourceLines[line - 1] ?? ""})
            }
        }
    }

    return lines
}
