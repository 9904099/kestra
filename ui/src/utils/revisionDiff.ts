import {flowYamlUtils} from "@kestra-io/topology"

export type BlockSection = "tasks" | "triggers" | "errors" | "finally" | "afterExecution"

// "flow" is a synthetic section carrying flow-level property changes (namespace,
// inputs, variables, concurrency, disabled, ...) that live outside the block sections.
export type DiffSection = BlockSection | "flow"

export type BlockChangeType = "added" | "removed" | "modified" | "unchanged"

export interface FieldChange {
    field: string
    oldValue: unknown
    newValue: unknown
}

export interface BlockDiff {
    id: string
    type: string | undefined
    section: DiffSection
    changeType: BlockChangeType
    fieldChanges: FieldChange[]
}

export interface RevisionDiff {
    blockDiffs: BlockDiff[]
    hasChanges: boolean
}

const SECTIONS: BlockSection[] = ["tasks", "triggers", "errors", "finally", "afterExecution"]

function blockListFromSection(flow: Record<string, unknown>, section: BlockSection): Record<string, unknown>[] {
    const raw = flow[section]
    if (!Array.isArray(raw)) return []
    return raw.filter((b): b is Record<string, unknown> => b !== null && typeof b === "object")
}

function topLevelFieldChanges(oldBlock: Record<string, unknown>, newBlock: Record<string, unknown>): FieldChange[] {
    const allKeys = new Set([...Object.keys(oldBlock), ...Object.keys(newBlock)])
    const changes: FieldChange[] = []

    for (const key of allKeys) {
        const oldVal = oldBlock[key]
        const newVal = newBlock[key]
        const oldSerialized = JSON.stringify(oldVal)
        const newSerialized = JSON.stringify(newVal)
        if (oldSerialized !== newSerialized) {
            changes.push({field: key, oldValue: oldVal, newValue: newVal})
        }
    }

    return changes
}

// Flow-level properties are every top-level key that is not a block section —
// namespace, description, inputs, variables, labels, concurrency, sla, disabled,
// pluginDefaults, etc. (exactly what the no-code flow-properties panel edits).
function flowLevelFieldChanges(leftFlow: Record<string, unknown>, rightFlow: Record<string, unknown>): FieldChange[] {
    const sectionKeys = new Set<string>(SECTIONS)
    const keys = [...new Set([...Object.keys(leftFlow), ...Object.keys(rightFlow)])].filter(k => !sectionKeys.has(k))
    const changes: FieldChange[] = []

    for (const key of keys) {
        const oldVal = leftFlow[key]
        const newVal = rightFlow[key]
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({field: key, oldValue: oldVal, newValue: newVal})
        }
    }

    return changes
}

export function computeRevisionDiff(leftSource: string, rightSource: string): RevisionDiff {
    const leftFlow = (flowYamlUtils.parse<Record<string, unknown>>(leftSource, false) ?? {}) as Record<string, unknown>
    const rightFlow = (flowYamlUtils.parse<Record<string, unknown>>(rightSource, false) ?? {}) as Record<string, unknown>

    const blockDiffs: BlockDiff[] = []

    const flowFieldChanges = flowLevelFieldChanges(leftFlow, rightFlow)
    if (flowFieldChanges.length > 0) {
        blockDiffs.push({
            id: String(rightFlow.id ?? leftFlow.id ?? "flow"),
            type: undefined,
            section: "flow",
            changeType: "modified",
            fieldChanges: flowFieldChanges,
        })
    }

    for (const section of SECTIONS) {
        const leftBlocks = blockListFromSection(leftFlow, section)
        const rightBlocks = blockListFromSection(rightFlow, section)

        const leftById = new Map(leftBlocks.map(b => [String(b.id), b]))
        const rightById = new Map(rightBlocks.map(b => [String(b.id), b]))

        // Relative rank of the ids present on BOTH sides, in each side's order.
        // Keying off the common subsequence means an add/remove that shifts an
        // absolute index is not mistaken for a reorder — only a genuine change
        // in relative order flags a block as moved.
        const rankInLeft = new Map(leftBlocks.map(b => String(b.id)).filter(id => rightById.has(id)).map((id, i) => [id, i]))
        const rankInRight = new Map(rightBlocks.map(b => String(b.id)).filter(id => leftById.has(id)).map((id, i) => [id, i]))

        const allIds = [...new Set([...leftById.keys(), ...rightById.keys()])]

        for (const id of allIds) {
            const leftBlock = leftById.get(id)
            const rightBlock = rightById.get(id)

            if (leftBlock === undefined) {
                blockDiffs.push({
                    id,
                    type: rightBlock ? String(rightBlock.type) : undefined,
                    section,
                    changeType: "added",
                    fieldChanges: [],
                })
            } else if (rightBlock === undefined) {
                blockDiffs.push({
                    id,
                    type: String(leftBlock.type),
                    section,
                    changeType: "removed",
                    fieldChanges: [],
                })
            } else {
                const fieldChanges = topLevelFieldChanges(leftBlock, rightBlock)
                const oldRank = rankInLeft.get(id)
                const newRank = rankInRight.get(id)
                if (oldRank !== undefined && newRank !== undefined && oldRank !== newRank) {
                    fieldChanges.unshift({field: "(order)", oldValue: oldRank, newValue: newRank})
                }
                blockDiffs.push({
                    id,
                    type: String(rightBlock.type ?? leftBlock.type),
                    section,
                    changeType: fieldChanges.length > 0 ? "modified" : "unchanged",
                    fieldChanges,
                })
            }
        }
    }

    return {
        blockDiffs,
        hasChanges: blockDiffs.some(d => d.changeType !== "unchanged"),
    }
}
