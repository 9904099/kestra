<template>
    <div
        class="branch-lane"
        :class="`branch-lane--${laneColor}`"
        :data-test="`branch-lane-${laneName}`"
        :aria-label="laneLabel"
    >
        <div class="branch-lane-header" aria-hidden="true">
            <component :is="laneIcon" class="branch-lane-icon" />
            <span class="branch-lane-label">{{ laneLabel }}</span>

            <KsTag
                v-if="depth >= MAX_INDENT_DEPTH"
                size="small"
                class="branch-lane-depth-pill"
            >
                {{ t("block_editor.depth_pill", {depth}) }}
            </KsTag>
        </div>

        <div class="branch-lane-body" :style="indentStyle">
            <template v-if="tasks.length > 0">
                <template v-for="(task, index) in tasks" :key="resolveBlockDomId(tasks, index)">
                    <BlockInsertionCaret v-if="focusedId !== undefined && focusedId === resolveBlockDomId(tasks, index)" position="before" />
                    <FlowableClusterCard
                        v-if="isFlowable(task)"
                        :block="task"
                        :icons="icons"
                        :path="`${parentPath}[${index}]`"
                        :depth="depth + 1"
                        :selectedId="selectedId"
                        :focusedId="focusedId"
                        :domId="resolveBlockDomId(tasks, index)"
                        :data-block-id="resolveBlockDomId(tasks, index)"
                        @select="(p) => emit('select', p)"
                        @delete="(p) => emit('delete', p)"
                        @duplicate="(p) => emit('duplicate', p)"
                        @add-at-path="(p, afterIdx) => emit('add-at-path', p, afterIdx)"
                    />
                    <LeafBlockCard
                        v-else
                        :block="task"
                        :icons="icons"
                        :path="`${parentPath}[${index}]`"
                        :selected="selectedId === String(task.id)"
                        :focused="focusedId !== undefined && focusedId === resolveBlockDomId(tasks, index)"
                        :draggable="true"
                        :dragOver="dragOverIndex === index"
                        :data-block-id="resolveBlockDomId(tasks, index)"
                        :data-test="`nested-block-card`"
                        @select="emit('select', `${parentPath}[${index}]`)"
                        @delete="emit('delete', `${parentPath}[${index}]`)"
                        @duplicate="emit('duplicate', `${parentPath}[${index}]`)"
                        @drag-start="handleDragStart($event, index)"
                        @drag-over="handleDragOver($event, index)"
                        @drop="handleDrop($event, index)"
                        @drag-end="handleDragEnd"
                    />
                    <BlockInsertionCaret v-if="focusedId !== undefined && focusedId === resolveBlockDomId(tasks, index)" />
                </template>
            </template>

            <KsAlert
                v-else-if="laneName === 'then'"
                type="warning"
                :title="t('block_editor.then_required_warning')"
                class="branch-lane-warning"
            />

            <!-- Roving tabindex: part of the canvas composite, so it's only a
            Tab stop while it carries the keyboard focus ring ("a" covers
            insertion from anywhere else). -->
            <button
                class="branch-lane-add-btn"
                type="button"
                :data-test="`branch-lane-add-${laneName}`"
                :data-block-id="tasks.length === 0 ? `__lane:${parentPath}` : undefined"
                :class="{'block-kbd-focused': tasks.length === 0 && focusedId === `__lane:${parentPath}`}"
                :tabindex="tasks.length === 0 && focusedId === `__lane:${parentPath}` ? 0 : -1"
                :aria-label="t('block_editor.add_to_lane', {lane: laneLabel})"
                @click="emit('add-at-path', parentPath, tasks.length - 1, $event)"
            >
                <PlusCircleOutline class="branch-lane-add-icon" />
                {{ t("block_editor.add_to_lane", {lane: laneLabel}) }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {computed, defineAsyncComponent, type Component} from "vue"
    import {useI18n} from "vue-i18n"
    import PlusCircleOutline from "vue-material-design-icons/PlusCircleOutline.vue"
    import AlertCircleOutline from "vue-material-design-icons/AlertCircleOutline.vue"
    import AlertOutline from "vue-material-design-icons/AlertOutline.vue"
    import CheckOutline from "vue-material-design-icons/CheckOutline.vue"
    import CloseOutline from "vue-material-design-icons/CloseOutline.vue"
    import CodeBranchesIcon from "vue-material-design-icons/SourceBranch.vue"
    import TagOutline from "vue-material-design-icons/TagOutline.vue"

    import {KsTag, KsAlert} from "@kestra-io/design-system"

    import {isFlowableType, resolveBlockDomId} from "../../../utils/flowableBlockOps"
    import {useDragAndDrop} from "../../../composables/useDragAndDrop"
    import BlockInsertionCaret from "./BlockInsertionCaret.vue"

    const FlowableClusterCard = defineAsyncComponent(() => import("./FlowableClusterCard.vue"))
    const LeafBlockCard = defineAsyncComponent(() => import("./LeafBlockCard.vue"))

    const {t} = useI18n()

    const MAX_INDENT_DEPTH = 4

    const props = defineProps<{
        laneName: string
        tasks: Record<string, unknown>[]
        parentPath: string
        icons?: Record<string, {icon: string; flowable: boolean}>
        selectedId?: string
        focusedId?: string
        depth?: number
    }>()

    const emit = defineEmits<{
        (e: "select", path: string): void
        (e: "delete", path: string): void
        (e: "duplicate", path: string): void
        (e: "add-at-path", parentPath: string, afterIndex: number, evt?: Event): void
        (e: "reorder", parentPath: string, fromIndex: number, toIndex: number): void
    }>()

    const {dragOverIndex, handleDragStart, handleDragOver, handleDragEnd, handleDrop: baseDrop} = useDragAndDrop()

    function handleDrop(event: DragEvent, targetIndex: number) {
        baseDrop(event, targetIndex, (from, to) => {
            emit("reorder", props.parentPath, from, to)
        })
    }

    const depth = computed(() => props.depth ?? 0)

    const laneColor = computed(() => {
        if (props.laneName === "errors") return "error"
        if (props.laneName === "finally") return "warning"
        return "neutral"
    })

    const laneIcon = computed((): Component => {
        if (props.laneName === "errors") return AlertCircleOutline
        if (props.laneName === "finally") return AlertOutline
        if (props.laneName === "then") return CheckOutline
        if (props.laneName === "else") return CloseOutline
        if (props.laneName === "defaults") return CodeBranchesIcon
        if (props.laneName.startsWith("cases.")) return TagOutline
        return CodeBranchesIcon
    })

    const laneLabel = computed(() => {
        if (props.laneName === "then") return t("block_editor.lane_then")
        if (props.laneName === "else") return t("block_editor.lane_else")
        if (props.laneName === "errors") return t("block_editor.lane_errors")
        if (props.laneName === "finally") return t("block_editor.lane_finally")
        if (props.laneName === "defaults") return t("block_editor.lane_defaults")
        if (props.laneName === "tasks") return t("block_editor.lane_tasks")
        if (props.laneName.startsWith("cases.")) {
            const caseKey = props.laneName.slice("cases.".length)
            return t("block_editor.lane_case", {key: caseKey})
        }
        return props.laneName.toUpperCase()
    })

    const indentStyle = computed(() => {
        const effectiveDepth = Math.min(depth.value, MAX_INDENT_DEPTH)
        return effectiveDepth > 0
            ? {paddingLeft: `calc(${effectiveDepth} * var(--ks-spacing-3))`}
            : {}
    })

    function isFlowable(task: Record<string, unknown>): boolean {
        return isFlowableType(String(task.type ?? ""), props.icons)
    }
</script>

<style scoped lang="scss">
    .branch-lane {
        display: flex;
        flex-direction: column;
        border-left: 2px solid var(--ks-border-strong);
        padding-left: var(--ks-spacing-3);

        &--error {
            border-left-color: var(--ks-status-error);
        }

        &--warning {
            border-left-color: var(--ks-status-warning);
        }
    }

    .branch-lane-header {
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        margin-bottom: var(--ks-spacing-2);
    }

    .branch-lane-icon {
        font-size: var(--ks-font-size-sm);
        display: flex;
        flex-shrink: 0;
        color: var(--ks-icon-muted);

        .branch-lane--error & {
            color: var(--ks-status-error);
        }

        .branch-lane--warning & {
            color: var(--ks-status-warning);
        }
    }

    .branch-lane-label {
        font-size: var(--ks-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ks-text-muted);

        .branch-lane--error & {
            color: var(--ks-status-error);
        }

        .branch-lane--warning & {
            color: var(--ks-status-warning);
        }
    }

    .branch-lane-depth-pill {
        margin-left: auto;
    }

    .branch-lane-body {
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-2);
    }

    .branch-lane-warning {
        margin-bottom: var(--ks-spacing-1);
    }

    .branch-lane-add-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        background: transparent;
        border: 1px dashed var(--ks-border-default);
        border-radius: var(--ks-radius-base);
        color: var(--ks-text-secondary);
        font-size: var(--ks-font-size-sm);
        padding: var(--ks-spacing-1) var(--ks-spacing-2);
        cursor: pointer;
        transition: color 0.15s, border-color 0.15s;

        &:hover {
            color: var(--ks-text-link);
            border-color: var(--ks-text-link);
        }

        &:focus-visible {
            outline: 2px solid var(--ks-border-focus);
            outline-offset: 1px;
        }
    }

    // Reactive canvas-focus ring for an empty lane's sentinel (see the
    // __lane: prefix used for data-block-id above) — mirrors the ring every
    // real block card already has.
    .branch-lane-add-btn.block-kbd-focused {
        border-color: var(--ks-border-focus);
        box-shadow: 0 0 0 2px var(--ks-border-focus);
    }

    .branch-lane-add-icon {
        font-size: var(--ks-font-size-sm);
        display: flex;
    }
</style>
