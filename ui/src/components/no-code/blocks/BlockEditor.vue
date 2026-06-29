<template>
    <div
        ref="editorEl"
        class="block-editor"
        data-test="block-editor"
        tabindex="-1"
        @keydown="onEditorKeydown"
    >
        <div class="block-editor-canvas">
            <BlockSectionCard
                name="triggers"
                :title="t('no_code.sections.triggers')"
                :icon="TriggerIcon"
                :count="parsedTriggers.length"
                :addLabel="t('block_editor.add_trigger')"
                @add="(e) => openTaskPicker('triggers', e)"
            >
                <div class="block-section-list" data-test="block-editor-trigger-list">
                    <BlockCard
                        v-for="(trigger, index) in parsedTriggers"
                        :key="String(trigger.id ?? index)"
                        :block="trigger"
                        :selected="selectedId === String(trigger.id)"
                        :draggable="true"
                        :dragOver="triggerDragOverIndex === index"
                        :icons="pluginsStore.icons"
                        :data-block-id="String(trigger.id ?? index)"
                        @select="selectBlock('triggers', trigger)"
                        @delete="onDelete('triggers', trigger.id)"
                        @duplicate="onDuplicate('triggers', trigger.id)"
                        @drag-start="handleTriggerDragStart($event, index)"
                        @drag-over="handleTriggerDragOver($event, index)"
                        @drop="handleTriggerDrop($event, index)"
                        @drag-end="handleTriggerDragEnd"
                    />
                    <BlockEmptyDrop
                        v-if="parsedTriggers.length === 0"
                        variant="empty"
                        :label="t('block_editor.trigger_noun')"
                        @add="(e) => openTaskPicker('triggers', e)"
                    />
                </div>
            </BlockSectionCard>

            <BlockSectionCard
                name="tasks"
                :title="t('no_code.sections.tasks')"
                :icon="TasksIcon"
                :count="parsedTasks.length"
                :addLabel="t('block_editor.add_task')"
                addTest="block-editor-add-task"
                @add="(e) => openTaskPicker('tasks', e)"
            >
                <div
                    class="block-section-list"
                    data-test="block-editor-task-list"
                    @dragend="handleTaskDragEnd"
                >
                    <template v-for="(task, index) in parsedTasks" :key="String(task.id ?? index)">
                        <FlowableClusterCard
                            v-if="isFlowable(task)"
                            :block="task"
                            :path="`tasks[${index}]`"
                            :icons="pluginsStore.icons"
                            :selectedId="selectedId"
                            :depth="0"
                            :data-block-id="String(task.id ?? index)"
                            data-test="block-card"
                            @select="openNestedEdit"
                            @delete="onDeleteAtPath"
                            @duplicate="onDuplicateAtPath"
                            @add-at-path="openTaskPickerAtPath"
                            @dragover.prevent="handleTaskDragOver($event, index)"
                            @drop.prevent="handleTaskDrop($event, index)"
                        />
                        <BlockCard
                            v-else
                            :block="task"
                            :selected="selectedId === String(task.id)"
                            :draggable="true"
                            :dragOver="taskDragOverIndex === index"
                            :icons="pluginsStore.icons"
                            :data-block-id="String(task.id ?? index)"
                            @select="selectBlock('tasks', task)"
                            @delete="onDelete('tasks', task.id)"
                            @duplicate="onDuplicate('tasks', task.id)"
                            @drag-start="handleTaskDragStart($event, index)"
                            @drag-over="handleTaskDragOver($event, index)"
                            @drop="handleTaskDrop($event, index)"
                            @drag-end="handleTaskDragEnd"
                        />
                    </template>

                    <BlockEmptyDrop
                        v-if="parsedTasks.length === 0"
                        variant="empty"
                        :label="t('block_editor.task_noun')"
                        :hint="t('block_editor.empty_add_hint')"
                        @add="(e) => openTaskPicker('tasks', e)"
                    />
                    <BlockEmptyDrop
                        v-else
                        variant="inline"
                        :label="t('block_editor.task_noun')"
                        :hint="t('block_editor.empty_add_hint')"
                        @add="(e) => openTaskPicker('tasks', e)"
                    />
                </div>
            </BlockSectionCard>

            <BlockSectionCard
                name="errors"
                :title="t('block_editor.lane_errors')"
                :icon="ErrorIcon"
                :count="flowLevelErrors.length"
                :addLabel="t('block_editor.add_error_task')"
                tone="error"
                @add="(e) => openTaskPicker('errors', e)"
            >
                <div class="block-section-list">
                    <template v-for="(task, index) in flowLevelErrors" :key="String(task.id ?? index)">
                        <FlowableClusterCard
                            v-if="isFlowable(task)"
                            :block="task"
                            :path="`errors[${index}]`"
                            :icons="pluginsStore.icons"
                            :selectedId="selectedId"
                            :depth="0"
                            :data-block-id="String(task.id ?? index)"
                            data-test="block-card"
                            @select="openNestedEdit"
                            @delete="onDeleteAtPath"
                            @duplicate="onDuplicateAtPath"
                            @add-at-path="openTaskPickerAtPath"
                        />
                        <BlockCard
                            v-else
                            :block="task"
                            :selected="selectedId === String(task.id)"
                            :icons="pluginsStore.icons"
                            :data-block-id="String(task.id ?? index)"
                            @select="selectBlock('errors', task)"
                            @delete="onDelete('errors', task.id)"
                            @duplicate="onDuplicate('errors', task.id)"
                        />
                    </template>
                    <BlockEmptyDrop
                        v-if="flowLevelErrors.length === 0"
                        variant="empty"
                        :label="t('block_editor.error_task_noun')"
                        @add="(e) => openTaskPicker('errors', e)"
                    />
                </div>
            </BlockSectionCard>

            <BlockSectionCard
                name="finally"
                :title="t('block_editor.lane_finally')"
                :icon="FinallyIcon"
                :count="flowLevelFinally.length"
                :addLabel="t('block_editor.add_task')"
                tone="warning"
                @add="(e) => openTaskPicker('finally', e)"
            >
                <div class="block-section-list">
                    <template v-for="(task, index) in flowLevelFinally" :key="String(task.id ?? index)">
                        <FlowableClusterCard
                            v-if="isFlowable(task)"
                            :block="task"
                            :path="`finally[${index}]`"
                            :icons="pluginsStore.icons"
                            :selectedId="selectedId"
                            :depth="0"
                            :data-block-id="String(task.id ?? index)"
                            data-test="block-card"
                            @select="openNestedEdit"
                            @delete="onDeleteAtPath"
                            @duplicate="onDuplicateAtPath"
                            @add-at-path="openTaskPickerAtPath"
                        />
                        <BlockCard
                            v-else
                            :block="task"
                            :selected="selectedId === String(task.id)"
                            :icons="pluginsStore.icons"
                            :data-block-id="String(task.id ?? index)"
                            @select="selectBlock('finally', task)"
                            @delete="onDelete('finally', task.id)"
                            @duplicate="onDuplicate('finally', task.id)"
                        />
                    </template>
                    <BlockEmptyDrop
                        v-if="flowLevelFinally.length === 0"
                        variant="empty"
                        :label="t('block_editor.task_noun')"
                        @add="(e) => openTaskPicker('finally', e)"
                    />
                </div>
            </BlockSectionCard>
        </div>

        <TaskEdit
            v-if="editingBlock"
            :key="editingBlock.id"
            ref="taskEditRef"
            :task="editingBlock.data"
            :section="editingBlock.section"
            :flowId="flowId"
            :namespace="namespace"
            :isHidden="true"
            size="65%"
            data-test="block-editor-task-edit"
            @update:task="onTaskEdited"
            @close="onEditorClose"
        />

        <Teleport to="body">
            <div
                v-if="taskPickerVisible"
                class="block-editor-picker-overlay"
                @click="taskPickerVisible = false"
            >
                <div
                    class="block-editor-picker"
                    :style="pickerStyle"
                    data-test="block-editor-picker"
                    @click.stop
                    @keydown="onPickerKeydown"
                    @keydown.escape="taskPickerVisible = false"
                >
                    <p class="block-editor-picker-context">{{ t('block_editor.inserting_into', {section: sectionLabel}) }}</p>

                    <KsInput
                        v-model="taskPickerSearch"
                        :placeholder="t('block_editor.search_task_placeholder')"
                        :aria-label="t('block_editor.search_task_placeholder')"
                        aria-controls="block-editor-picker-listbox"
                        :aria-activedescendant="pickerFocusedIndex >= 0 ? `block-editor-picker-option-${pickerFocusedIndex}` : undefined"
                        clearable
                        autofocus
                        data-test="block-editor-picker-search"
                    />

                    <div v-if="!taskPickerSearch.trim()" class="block-editor-picker-tabs" role="tablist">
                        <button
                            v-for="tab in PICKER_TABS"
                            :key="tab.id"
                            type="button"
                            role="tab"
                            class="block-editor-picker-tab"
                            :class="{'block-editor-picker-tab--active': pickerTab === tab.id}"
                            :aria-selected="pickerTab === tab.id"
                            :data-test="`block-editor-picker-tab-${tab.id}`"
                            @click="setPickerTab(tab.id)"
                        >
                            <component :is="tab.icon" class="block-editor-picker-tab-ico" />
                            {{ t(tab.labelKey) }}
                            <span v-if="tab.id === 'apps'" class="block-editor-picker-tab-count">{{ appGroups.length }}</span>
                        </button>
                    </div>

                    <div
                        id="block-editor-picker-listbox"
                        v-ks-loading="pluginsLoading"
                        class="block-editor-picker-list"
                        :class="{'block-editor-picker-list--loading': pluginsLoading}"
                        :aria-label="t('block_editor.pick_task_type')"
                        data-test="block-editor-picker-list"
                        role="listbox"
                    >
                        <template v-if="!taskPickerSearch.trim() && pickerTab === 'apps' && !appFilter">
                            <button
                                v-for="grp in appGroups"
                                :key="grp.group"
                                type="button"
                                class="block-editor-picker-app"
                                @click="appFilter = grp.group"
                            >
                                <KsTaskIcon class="block-editor-picker-icon" :cls="grp.sampleFqcn" :icons="pluginsStore.icons" :onlyIcon="true" />
                                <span class="block-editor-picker-app-name">{{ grp.group }}</span>
                                <span class="block-editor-picker-app-count">{{ t('block_editor.app_actions', {count: grp.count}) }}</span>
                            </button>
                        </template>

                        <template v-else>
                            <div
                                v-if="appFilter && !taskPickerSearch.trim()"
                                class="block-editor-picker-back"
                                role="button"
                                tabindex="0"
                                @click="appFilter = undefined"
                                @keydown.enter="appFilter = undefined"
                            >
                                <ChevronLeft class="block-editor-picker-back-ico" />
                                {{ t('block_editor.all_apps') }}
                            </div>

                            <button
                                v-for="(type, idx) in displayedEntries"
                                :id="`block-editor-picker-option-${idx}`"
                                :key="type.fqcn"
                                class="block-editor-picker-row"
                                :class="{'block-editor-picker-row--focused': pickerFocusedIndex === idx}"
                                type="button"
                                role="option"
                                :aria-selected="pickerFocusedIndex === idx"
                                @click="insertTask(type.fqcn)"
                                @mouseenter="pickerFocusedIndex = idx"
                            >
                                <KsTaskIcon class="block-editor-picker-icon" :cls="type.fqcn" :icons="pluginsStore.icons" :onlyIcon="true" />
                                <span class="block-editor-picker-main">
                                    <span class="block-editor-picker-name">{{ type.name }}</span>
                                    <span class="block-editor-picker-desc">{{ type.label }}</span>
                                </span>
                                <span class="block-editor-picker-app-badge">{{ type.group }}</span>
                            </button>

                            <p v-if="!pluginsLoading && displayedEntries.length === 0" class="block-editor-picker-empty">
                                {{ (!taskPickerSearch.trim() && pickerTab === "recent") ? t("block_editor.no_recent") : t("block_editor.no_task_results") }}
                            </p>

                            <p v-else-if="taskPickerSearch.trim() && pickerHiddenCount > 0" class="block-editor-picker-more">
                                {{ t("block_editor.picker_more_results", {count: pickerHiddenCount}) }}
                            </p>
                        </template>
                    </div>

                    <div class="block-editor-picker-footer" aria-hidden="true">
                        <span><kbd>↑</kbd><kbd>↓</kbd> {{ t('block_editor.kbd_navigate') }}</span>
                        <span><kbd>↵</kbd> {{ t('block_editor.kbd_add') }}</span>
                        <span><kbd>esc</kbd> {{ t('block_editor.kbd_close') }}</span>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import {computed, nextTick, provide, ref, watch, type Component} from "vue"
    import {useI18n} from "vue-i18n"
    import TriggerIcon from "vue-material-design-icons/LightningBoltOutline.vue"
    import TasksIcon from "vue-material-design-icons/FormatListBulleted.vue"
    import ErrorIcon from "vue-material-design-icons/AlertCircleOutline.vue"
    import FinallyIcon from "vue-material-design-icons/FlagOutline.vue"
    import SuggestedIcon from "vue-material-design-icons/Creation.vue"
    import AppsIcon from "vue-material-design-icons/ViewGridOutline.vue"
    import RecentIcon from "vue-material-design-icons/History.vue"
    import ChevronLeft from "vue-material-design-icons/ChevronLeft.vue"

    import {KsTaskIcon, vKsLoading} from "@kestra-io/design-system"
    import {flowYamlUtils} from "@kestra-io/topology"

    import {useFlowStore} from "../../../stores/flow"
    import {usePluginsStore} from "../../../stores/plugins"
    import {isEntryAPluginElementPredicate, type PluginElement} from "../../../utils/pluginUtils"
    import {
        addBlock,
        addBlockAtPath,
        buildMinimalTask,
        collectAllIds,
        deleteBlock,
        deleteBlockAtPath,
        duplicateBlock,
        duplicateBlockAtPath,
        isFlowableType,
        moveBlockAtPath,
        reorderAtPath,
        updateBlock,
        updateBlockAtPath,
        type BlockSection,
    } from "../../../utils/flowableBlockOps"
    import {useDragAndDrop} from "../../../composables/useDragAndDrop"
    import BlockCard from "./BlockCard.vue"
    import BlockSectionCard from "./BlockSectionCard.vue"
    import BlockEmptyDrop from "./BlockEmptyDrop.vue"
    import FlowableClusterCard from "./FlowableClusterCard.vue"
    import TaskEdit from "../../flows/TaskEdit.vue"
    import {BLOCK_SCHEMA_PATH_INJECTION_KEY} from "../injectionKeys"

    const {t} = useI18n()
    const flowStore = useFlowStore()
    const pluginsStore = usePluginsStore()

    const props = defineProps<{
        selectedId?: string
    }>()

    const emit = defineEmits<{
        (e: "update:selectedId", id: string | undefined): void
    }>()

    const flowYaml = computed<string>(() => flowStore.flowYaml ?? "")
    const flowId = computed<string>(() => flowStore.flow?.id ?? "")
    const namespace = computed<string>(() => flowStore.flow?.namespace ?? "")

    const parsedFlow = computed(() => {
        try {
            return flowYamlUtils.parse<Record<string, unknown>>(flowYaml.value)
        } catch {
            return undefined
        }
    })

    function isFlowable(task: Record<string, unknown>): boolean {
        return isFlowableType(String(task.type ?? ""), pluginsStore.icons)
    }

    const parsedTasks = computed<Record<string, unknown>[]>(() => {
        const tasks = parsedFlow.value?.tasks
        return Array.isArray(tasks) ? tasks : []
    })

    const parsedTriggers = computed<Record<string, unknown>[]>(() => {
        const triggers = parsedFlow.value?.triggers
        return Array.isArray(triggers) ? triggers : []
    })

    const flowLevelErrors = computed<Record<string, unknown>[]>(() => {
        const errors = parsedFlow.value?.errors
        return Array.isArray(errors) ? errors : []
    })

    const flowLevelFinally = computed<Record<string, unknown>[]>(() => {
        const fin = parsedFlow.value?.finally
        return Array.isArray(fin) ? fin : []
    })

    function sectionList(section: BlockSection): Record<string, unknown>[] {
        if (section === "triggers") return parsedTriggers.value
        if (section === "errors") return flowLevelErrors.value
        if (section === "finally") return flowLevelFinally.value
        return parsedTasks.value
    }

    const editorEl = ref<HTMLElement>()
    const internalSelectedId = ref<string | undefined>(props.selectedId)

    const selectedId = computed({
        get: () => internalSelectedId.value,
        set: (v: string | undefined) => {
            internalSelectedId.value = v
            emit("update:selectedId", v)
        },
    })

    watch(() => props.selectedId, async (id) => {
        internalSelectedId.value = id
        if (!id || !editorEl.value) return
        await nextTick()
        const card = editorEl.value.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null
        card?.scrollIntoView({block: "nearest", behavior: "smooth"})
    })

    interface EditingBlock {
        id: string
        section: BlockSection
        data: Record<string, unknown>
        path?: string
    }

    const editingBlock = ref<EditingBlock | undefined>(undefined)
    const taskEditRef = ref<InstanceType<typeof TaskEdit>>()

    provide(BLOCK_SCHEMA_PATH_INJECTION_KEY, computed(() => {
        const root = pluginsStore.flowSchema?.$ref
        if (!root) return ""
        const section = editingBlock.value?.section ?? "tasks"
        return `${root}/properties/${section}/items`
    }))

    async function selectBlock(section: BlockSection, block: Record<string, unknown>) {
        const strId = block.id != null ? String(block.id) : undefined
        if (!strId) return

        if (selectedId.value === strId) {
            selectedId.value = undefined
            editingBlock.value = undefined
            return
        }

        selectedId.value = strId
        editingBlock.value = {id: strId, section, data: block}
        await nextTick()
        taskEditRef.value?.open()
    }

    async function openNestedEdit(path: string) {
        const blockYaml = flowYamlUtils.extractBlockWithPath({source: flowYaml.value, path})
        if (!blockYaml) return

        const parsed = flowYamlUtils.parse<Record<string, unknown>>(blockYaml)
        if (!parsed || !parsed.id) return

        const strId = String(parsed.id)
        if (selectedId.value === strId) {
            selectedId.value = undefined
            editingBlock.value = undefined
            return
        }

        selectedId.value = strId
        const section: BlockSection = path.startsWith("errors") ? "errors" : path.startsWith("finally") ? "finally" : "tasks"
        editingBlock.value = {id: strId, section, data: parsed, path}
        await nextTick()
        taskEditRef.value?.open()
    }

    function onEditorClose() {
        selectedId.value = undefined
        editingBlock.value = undefined
    }

    const onEditTimeout = ref<ReturnType<typeof setTimeout>>()

    function applyYaml(newYaml: string) {
        flowStore.flowYaml = newYaml
        clearTimeout(onEditTimeout.value)
        onEditTimeout.value = setTimeout(() => {
            flowStore.onEdit({source: newYaml, topologyVisible: true})
        }, 1000)
    }

    function onTaskEdited(newContent: string) {
        if (!editingBlock.value) return
        const {section, id, path} = editingBlock.value
        if (path) {
            applyYaml(updateBlockAtPath(flowYaml.value, path, newContent))
        } else {
            applyYaml(updateBlock(flowYaml.value, section, id, newContent))
        }
        editingBlock.value = undefined
        selectedId.value = undefined
    }

    function onDelete(section: BlockSection, id: unknown) {
        if (typeof id !== "string") return
        const newYaml = deleteBlock(flowYaml.value, section, id)
        if (selectedId.value === id) {
            selectedId.value = undefined
            editingBlock.value = undefined
        }
        applyYaml(newYaml)
    }

    function onDeleteAtPath(path: string) {
        const newYaml = deleteBlockAtPath(flowYaml.value, path)
        const blockYaml = flowYamlUtils.extractBlockWithPath({source: flowYaml.value, path})
        if (blockYaml) {
            const parsed = flowYamlUtils.parse<Record<string, unknown>>(blockYaml)
            if (parsed?.id && selectedId.value === String(parsed.id)) {
                selectedId.value = undefined
                editingBlock.value = undefined
            }
        }
        applyYaml(newYaml)
    }

    function onDuplicate(section: BlockSection, id: unknown) {
        if (typeof id !== "string") return
        applyYaml(duplicateBlock(flowYaml.value, section, id))
    }

    function onDuplicateAtPath(path: string) {
        applyYaml(duplicateBlockAtPath(flowYaml.value, path))
    }

    const taskPickerVisible = ref(false)
    const pickerAnchor = ref<HTMLElement>()
    const taskPickerSearch = ref("")
    const taskPickerSection = ref<BlockSection>("tasks")
    const taskPickerParentPath = ref<string | undefined>(undefined)
    const taskPickerAfterIndex = ref<number | undefined>(undefined)
    const pluginsLoading = ref(false)
    const pickerFocusedIndex = ref(-1)

    type PickerTab = "suggested" | "apps" | "recent"
    const pickerTab = ref<PickerTab>("suggested")
    const appFilter = ref<string | undefined>(undefined)
    const recentFqcns = ref<string[]>([])

    const PICKER_TABS: ReadonlyArray<{id: PickerTab; labelKey: string; icon: Component}> = [
        {id: "suggested", labelKey: "block_editor.tab_suggested", icon: SuggestedIcon},
        {id: "apps", labelKey: "block_editor.tab_apps", icon: AppsIcon},
        {id: "recent", labelKey: "block_editor.tab_recent", icon: RecentIcon},
    ]

    const RECENT_KEY = "blockEditor.recentTaskTypes"
    const SUGGESTED_FQCNS = [
        "io.kestra.plugin.core.log.Log",
        "io.kestra.plugin.core.http.Request",
        "io.kestra.plugin.scripts.python.Script",
        "io.kestra.plugin.scripts.shell.Commands",
        "io.kestra.plugin.core.flow.Subflow",
        "io.kestra.plugin.core.flow.If",
        "io.kestra.plugin.core.flow.Switch",
        "io.kestra.plugin.core.flow.ForEach",
        "io.kestra.plugin.core.flow.Parallel",
        "io.kestra.plugin.core.flow.Dag",
    ]

    function anchorFrom(evt?: Event) {
        pickerAnchor.value = (evt?.currentTarget as HTMLElement) ?? editorEl.value ?? undefined
    }

    function resetPickerView() {
        taskPickerSearch.value = ""
        pickerFocusedIndex.value = -1
        pickerTab.value = "suggested"
        appFilter.value = undefined
        loadRecent()
    }

    function openTaskPicker(section: BlockSection, evt?: Event) {
        anchorFrom(evt)
        taskPickerSection.value = section
        taskPickerParentPath.value = undefined
        taskPickerAfterIndex.value = undefined
        resetPickerView()
        taskPickerVisible.value = true
        ensurePluginData()
    }

    function openTaskPickerAtPath(parentPath: string, afterIndex: number, evt?: Event) {
        anchorFrom(evt)
        taskPickerParentPath.value = parentPath
        taskPickerAfterIndex.value = afterIndex >= 0 ? afterIndex : undefined
        resetPickerView()
        taskPickerVisible.value = true
        ensurePluginData()
    }

    const pickerStyle = computed(() => {
        const anchor = pickerAnchor.value
        if (!anchor) return {}
        const rect = anchor.getBoundingClientRect()
        const width = 440
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
        return {
            top: `${rect.bottom + 4}px`,
            left: `${left}px`,
            width: `${width}px`,
        }
    })

    function ensurePluginData() {
        if (pluginsStore.plugins) return
        pluginsLoading.value = true
        pluginsStore.ensurePlugins().finally(() => {
            pluginsLoading.value = false
        })
    }

    interface PickerEntry {
        fqcn: string
        name: string
        label: string
        group: string
    }

    const allPickerEntries = computed<PickerEntry[]>(() => {
        if (!pluginsStore.plugins) return []
        const entries: PickerEntry[] = []
        for (const plugin of pluginsStore.plugins) {
            for (const [key, value] of Object.entries(plugin)) {
                if (!isEntryAPluginElementPredicate(key, value)) continue
                for (const el of value as PluginElement[]) {
                    if (el.deprecated) continue
                    const parts = el.cls.split(".")
                    entries.push({
                        fqcn: el.cls,
                        name: parts[parts.length - 1] ?? el.cls,
                        label: el.title ?? parts[parts.length - 1] ?? el.cls,
                        group: plugin.title ?? plugin.name ?? "",
                    })
                }
            }
        }
        return entries
    })

    const PICKER_MAX_RESULTS = 50

    const filteredMatches = computed<PickerEntry[]>(() => {
        const search = taskPickerSearch.value.trim().toLowerCase()
        const source = allPickerEntries.value
        if (!search) return source
        return source.filter(
            entry =>
                entry.label.toLowerCase().includes(search) ||
                entry.fqcn.toLowerCase().includes(search) ||
                entry.group.toLowerCase().includes(search),
        )
    })

    const filteredCommonTypes = computed<PickerEntry[]>(() =>
        filteredMatches.value.slice(0, PICKER_MAX_RESULTS),
    )

    const pickerHiddenCount = computed(() =>
        Math.max(0, filteredMatches.value.length - PICKER_MAX_RESULTS),
    )

    const entryByFqcn = computed(() => {
        const map = new Map<string, PickerEntry>()
        for (const entry of allPickerEntries.value) map.set(entry.fqcn, entry)
        return map
    })

    const suggestedEntries = computed<PickerEntry[]>(() =>
        SUGGESTED_FQCNS.map(fqcn => entryByFqcn.value.get(fqcn)).filter((e): e is PickerEntry => Boolean(e)),
    )

    const recentEntries = computed<PickerEntry[]>(() =>
        recentFqcns.value.map(fqcn => entryByFqcn.value.get(fqcn)).filter((e): e is PickerEntry => Boolean(e)),
    )

    const appGroups = computed(() => {
        const groups = new Map<string, {group: string; count: number; sampleFqcn: string}>()
        for (const entry of allPickerEntries.value) {
            const existing = groups.get(entry.group)
            if (existing) existing.count++
            else groups.set(entry.group, {group: entry.group, count: 1, sampleFqcn: entry.fqcn})
        }
        return [...groups.values()].sort((a, b) => b.count - a.count)
    })

    const displayedEntries = computed<PickerEntry[]>(() => {
        if (taskPickerSearch.value.trim()) return filteredCommonTypes.value
        if (pickerTab.value === "suggested") return suggestedEntries.value
        if (pickerTab.value === "recent") return recentEntries.value
        if (pickerTab.value === "apps" && appFilter.value) {
            return allPickerEntries.value.filter(e => e.group === appFilter.value).slice(0, PICKER_MAX_RESULTS)
        }
        return []
    })

    const sectionLabel = computed(() => {
        const section = taskPickerSection.value
        if (section === "triggers") return t("no_code.sections.triggers")
        if (section === "errors") return t("block_editor.lane_errors")
        if (section === "finally") return t("block_editor.lane_finally")
        return t("no_code.sections.tasks")
    })

    function setPickerTab(tab: PickerTab) {
        pickerTab.value = tab
        appFilter.value = undefined
        pickerFocusedIndex.value = -1
    }

    function loadRecent() {
        try {
            const raw = localStorage.getItem(RECENT_KEY)
            recentFqcns.value = raw ? JSON.parse(raw) : []
        } catch {
            recentFqcns.value = []
        }
    }

    function pushRecent(fqcn: string) {
        const next = [fqcn, ...recentFqcns.value.filter(f => f !== fqcn)].slice(0, 8)
        recentFqcns.value = next
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(next))
        } catch {
            // localStorage may be unavailable; recency is best-effort
        }
    }

    watch(filteredCommonTypes, () => {
        pickerFocusedIndex.value = -1
    })

    function onPickerKeydown(event: KeyboardEvent) {
        const list = displayedEntries.value
        if (list.length === 0) return
        if (event.key === "ArrowDown") {
            event.preventDefault()
            pickerFocusedIndex.value = Math.min(pickerFocusedIndex.value + 1, list.length - 1)
        } else if (event.key === "ArrowUp") {
            event.preventDefault()
            pickerFocusedIndex.value = Math.max(pickerFocusedIndex.value - 1, 0)
        } else if (event.key === "Enter" && pickerFocusedIndex.value >= 0) {
            event.preventDefault()
            const entry = list[pickerFocusedIndex.value]
            if (entry) insertTask(entry.fqcn)
        }
    }

    function insertTask(fqcn: string) {
        pushRecent(fqcn)
        const block = buildMinimalTask(fqcn, collectAllIds(flowYaml.value))

        if (taskPickerParentPath.value !== undefined) {
            applyYaml(addBlockAtPath(flowYaml.value, taskPickerParentPath.value, block, taskPickerAfterIndex.value))
        } else {
            const section = taskPickerSection.value
            const list = sectionList(section)
            const lastId = list.length > 0
                ? String(list[list.length - 1].id ?? "")
                : undefined
            applyYaml(addBlock(flowYaml.value, section, block, lastId))
        }
        taskPickerVisible.value = false
    }

    const {
        dragOverIndex: taskDragOverIndex,
        handleDragStart: handleTaskDragStart,
        handleDragOver: handleTaskDragOver,
        handleDragEnd: handleTaskDragEnd,
        handleDrop: handleTaskDropBase,
    } = useDragAndDrop()

    function clearSelectionIfPathStale(_parentSection: string, from: number, to: number) {
        const path = editingBlock.value?.path
        if (!path) return
        const match = path.match(/^tasks\[(\d+)\]/)
        if (!match) return
        const movedIndex = parseInt(match[1], 10)
        const lo = Math.min(from, to)
        const hi = Math.max(from, to)
        if (movedIndex >= lo && movedIndex <= hi) {
            selectedId.value = undefined
            editingBlock.value = undefined
        }
    }

    function handleTaskDrop(event: DragEvent, targetIndex: number) {
        handleTaskDropBase(event, targetIndex, (from, to) => {
            clearSelectionIfPathStale("tasks", from, to)
            applyYaml(reorderAtPath(flowYaml.value, "tasks", from, to))
        })
    }

    const {
        dragOverIndex: triggerDragOverIndex,
        handleDragStart: handleTriggerDragStart,
        handleDragOver: handleTriggerDragOver,
        handleDragEnd: handleTriggerDragEnd,
        handleDrop: handleTriggerDropBase,
    } = useDragAndDrop()

    function handleTriggerDrop(event: DragEvent, targetIndex: number) {
        handleTriggerDropBase(event, targetIndex, (from, to) => {
            applyYaml(reorderAtPath(flowYaml.value, "triggers", from, to))
        })
    }

    function onEditorKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

        if (event.key === "/" && !taskPickerVisible.value) {
            event.preventDefault()
            openTaskPicker("tasks")
            return
        }

        if (!selectedId.value) return

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault()
            deleteSelected()
        } else if (event.altKey && event.key === "ArrowUp") {
            event.preventDefault()
            moveSelected("up")
        } else if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault()
            moveSelected("down")
        }
    }

    function deleteSelected() {
        if (!selectedId.value) return
        const id = selectedId.value
        if (editingBlock.value?.path) {
            onDeleteAtPath(editingBlock.value.path)
        } else {
            const section = editingBlock.value?.section ?? "tasks"
            onDelete(section, id)
        }
    }

    function moveSelected(direction: "up" | "down") {
        if (!selectedId.value || !editingBlock.value) return
        const path = editingBlock.value.path
        if (!path) {
            const section = editingBlock.value.section
            const list = section === "tasks" ? parsedTasks.value
                : section === "errors" ? flowLevelErrors.value
                    : section === "finally" ? flowLevelFinally.value
                        : parsedTriggers.value
            const idx = list.findIndex(item => String(item.id) === selectedId.value)
            if (idx < 0) return
            const syntheticPath = `${section}[${idx}]`
            applyYaml(moveBlockAtPath(flowYaml.value, syntheticPath, direction))
        } else {
            const newYaml = moveBlockAtPath(flowYaml.value, path, direction)
            if (newYaml === flowYaml.value) return
            const match = path.match(/^(.*)\[(\d+)\]$/)
            if (match) {
                const newIndex = direction === "up" ? parseInt(match[2], 10) - 1 : parseInt(match[2], 10) + 1
                editingBlock.value = {...editingBlock.value, path: `${match[1]}[${newIndex}]`}
            }
            applyYaml(newYaml)
        }
    }
</script>

<style scoped lang="scss">
    .block-editor {
        height: 100%;
        overflow-y: auto;
        padding: var(--ks-spacing-6) var(--ks-spacing-4);
        background: var(--ks-bg-base);
    }

    .block-editor-canvas {
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-4);
        max-width: 880px;
        margin: 0 auto;
    }

    .block-section-list {
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-2);
    }

    .block-editor-picker-overlay {
        position: fixed;
        inset: 0;
        z-index: 3000;
    }

    .block-editor-picker {
        position: fixed;
        z-index: 3001;
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-2);
        max-height: 420px;
        padding: var(--ks-spacing-3);
        background: var(--ks-bg-elevated);
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-base);
        box-shadow: var(--ks-shadow-lg);
    }

    .block-editor-picker-context {
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
        margin: 0;
    }

    .block-editor-picker-tabs {
        display: flex;
        gap: var(--ks-spacing-1);
        border-bottom: 1px solid var(--ks-border-subtle);
    }

    .block-editor-picker-tab {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        padding: var(--ks-spacing-1) var(--ks-spacing-2);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--ks-text-secondary);
        font-size: var(--ks-font-size-xs);
        cursor: pointer;
        transition: color 0.12s, border-color 0.12s;
    }

    .block-editor-picker-tab:hover {
        color: var(--ks-text-primary);
    }

    .block-editor-picker-tab--active {
        color: var(--ks-text-link);
        border-bottom-color: var(--ks-text-link);
        font-weight: 600;
    }

    .block-editor-picker-tab-ico {
        display: flex;
        font-size: var(--ks-font-size-sm);
    }

    .block-editor-picker-tab-count {
        font-size: var(--ks-font-size-xs);
        font-family: var(--ks-font-family-mono);
        padding: 0 var(--ks-spacing-1);
        border-radius: var(--ks-radius-lg);
        background: var(--ks-bg-tag);
        color: var(--ks-text-muted);
    }

    .block-editor-picker-list {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-1);
        max-height: 320px;
        overflow-y: auto;

        &--loading {
            min-height: var(--ks-spacing-10);
        }
    }

    .block-editor-picker-row {
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-3);
        padding: var(--ks-spacing-2) var(--ks-spacing-3);
        border: none;
        border-radius: var(--ks-radius-base);
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.15s;

        &:hover,
        &--focused {
            background: var(--ks-bg-hover);
        }
    }

    .block-editor-picker-icon {
        flex-shrink: 0;
        width: var(--ks-icon-size-base);
        height: var(--ks-icon-size-base);
    }

    .block-editor-picker-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .block-editor-picker-name {
        font-size: var(--ks-font-size-sm);
        font-weight: 600;
        font-family: var(--ks-font-family-mono);
        color: var(--ks-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-editor-picker-desc {
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-editor-picker-app-badge {
        flex-shrink: 0;
        max-width: 40%;
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-editor-picker-app {
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-3);
        padding: var(--ks-spacing-2) var(--ks-spacing-3);
        border: none;
        border-radius: var(--ks-radius-base);
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.12s;
    }

    .block-editor-picker-app:hover {
        background: var(--ks-bg-hover);
    }

    .block-editor-picker-app-name {
        flex: 1;
        min-width: 0;
        font-size: var(--ks-font-size-sm);
        font-weight: 500;
        color: var(--ks-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-editor-picker-app-count {
        flex-shrink: 0;
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
    }

    .block-editor-picker-back {
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        padding: var(--ks-spacing-1) var(--ks-spacing-2);
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-secondary);
        cursor: pointer;
        border-radius: var(--ks-radius-base);
    }

    .block-editor-picker-back:hover {
        color: var(--ks-text-link);
    }

    .block-editor-picker-back-ico {
        display: flex;
    }

    .block-editor-picker-footer {
        display: flex;
        gap: var(--ks-spacing-4);
        padding-top: var(--ks-spacing-2);
        border-top: 1px solid var(--ks-border-subtle);
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
    }

    .block-editor-picker-footer kbd {
        font-family: var(--ks-font-family-mono);
        background: var(--ks-bg-tag);
        border-radius: var(--ks-radius-sm);
        padding: 0 var(--ks-spacing-1);
        margin-right: 2px;
    }

    .block-editor-picker-empty {
        color: var(--ks-text-muted);
        font-size: var(--ks-font-size-sm);
        text-align: center;
        padding: var(--ks-spacing-4);
        margin: 0;
    }

    .block-editor-picker-more {
        color: var(--ks-text-muted);
        font-size: var(--ks-font-size-xs);
        text-align: center;
        padding: var(--ks-spacing-2);
        margin: 0;
    }
</style>
