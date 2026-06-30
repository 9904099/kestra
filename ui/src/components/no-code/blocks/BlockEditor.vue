<template>
    <div
        ref="editorEl"
        class="block-editor"
        data-test="block-editor"
        tabindex="-1"
        @keydown="onEditorKeydown"
    >
        <KsSplitter class="block-editor-split">
            <KsSplitterPanel min="18%">
                <div class="block-editor-main">
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
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
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
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
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
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
                                    :label="t('block_editor.task_noun')"
                                    @add="(e) => openTaskPicker('finally', e)"
                                />
                            </div>
                        </BlockSectionCard>
                    </div>
                </div>
            </KsSplitterPanel>

            <KsSplitterPanel v-if="dockTabs.length" size="72%" min="40%">
                <div class="block-editor-dock">
                    <div class="block-editor-dock-tabbar" role="tablist" :aria-label="t('block_editor.open_details')">
                        <div
                            v-for="tab in dockTabs"
                            :key="tab.id"
                            role="tab"
                            tabindex="0"
                            class="block-editor-dock-tab"
                            :class="{
                                'block-editor-dock-tab--active': selectedId === tab.id,
                                'block-editor-dock-tab--tiled': tiledIds.has(tab.id) && selectedId !== tab.id,
                            }"
                            :aria-selected="selectedId === tab.id"
                            :data-test="`block-editor-dock-tab-${tab.id}`"
                            @click="activateTab(tab.id)"
                            @keydown.enter="activateTab(tab.id)"
                        >
                            <KsTaskIcon class="block-editor-dock-tab-ico" :cls="String(tab.data.type ?? '')" :icons="pluginsStore.icons" :onlyIcon="true" />
                            <span class="block-editor-dock-tab-id">{{ tab.id }}</span>
                            <KsIconButton
                                class="block-editor-dock-tab-close"
                                :aria-label="t('close')"
                                :data-test="`block-editor-dock-tab-close-${tab.id}`"
                                @click.stop="closeTab(tab.id)"
                            >
                                <Close />
                            </KsIconButton>
                        </div>
                        <span class="block-editor-dock-tabbar-spacer" />
                        <div
                            v-if="dockTabs.length > 1"
                            class="block-editor-dock-split"
                            role="group"
                            :aria-label="t('block_editor.split_view')"
                        >
                            <button
                                v-for="n in 3"
                                :key="n"
                                type="button"
                                class="block-editor-dock-split-btn"
                                :class="{'block-editor-dock-split-btn--active': splitCount === n}"
                                :disabled="dockTabs.length < n"
                                :aria-pressed="splitCount === n"
                                :aria-label="t('block_editor.split_into', {count: n})"
                                :title="t('block_editor.split_into', {count: n})"
                                :data-test="`block-editor-split-${n}`"
                                @click="splitCount = n"
                            >
                                <span class="block-editor-dock-split-glyph">
                                    <span v-for="c in n" :key="c" class="block-editor-dock-split-col" />
                                </span>
                            </button>
                        </div>
                        <KsIconButton
                            v-if="dockTabs.length > 1"
                            class="block-editor-dock-closeall"
                            :aria-label="t('block_editor.close_all')"
                            :tooltip="t('block_editor.close_all')"
                            @click="closeAllTabs"
                        >
                            <Close />
                        </KsIconButton>
                        <KsIconButton
                            class="block-editor-dock-help"
                            :aria-label="t('block_editor.shortcuts.title')"
                            :tooltip="t('block_editor.shortcuts.title')"
                            data-test="block-editor-help-dock"
                            @click="shortcutsOpen = true"
                        >
                            <Keyboard />
                        </KsIconButton>
                    </div>

                    <div class="block-editor-dock-body">
                        <TaskEdit
                            v-for="tab in dockTabs"
                            v-show="tiledIds.has(tab.id)"
                            :key="tab.id"
                            class="block-editor-dock-pane"
                            :class="{'block-editor-dock-pane--active': selectedId === tab.id && tiledIds.size > 1}"
                            :task="tab.data"
                            :section="tab.section"
                            :flowId="flowId"
                            :namespace="namespace"
                            :isHidden="true"
                            presentation="panel"
                            :hideTabstrip="true"
                            v-model:inputsCollapsed="dockInputsCollapsed"
                            v-model:outputCollapsed="dockOutputCollapsed"
                            v-model:docOpen="dockDocOpen"
                            data-test="block-editor-task-edit"
                            @mousedown="focusPane(tab.id)"
                            @focusin="focusPane(tab.id)"
                            @update:task="(content) => onTaskEdited(tab, content)"
                            @close="closeTab(tab.id)"
                        />
                    </div>
                </div>
            </KsSplitterPanel>
        </KsSplitter>

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

                    <div v-if="!hasSearch" class="block-editor-picker-tabs" role="tablist">
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
                        <template v-if="!hasSearch && pickerTab === 'apps' && !appFilter">
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
                                v-if="appFilter && !hasSearch"
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
                                {{ (!hasSearch && pickerTab === "recent") ? t("block_editor.no_recent") : t("block_editor.no_task_results") }}
                            </p>

                            <p v-else-if="hasSearch && pickerHiddenCount > 0" class="block-editor-picker-more">
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

        <KsDialog v-model="shortcutsOpen" :title="t('block_editor.shortcuts.title')" data-test="block-editor-shortcuts">
            <div class="block-editor-shortcuts">
                <div class="block-editor-shortcuts-col">
                    <span class="block-editor-shortcuts-heading">{{ t('block_editor.shortcuts.group_navigate') }}</span>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>j</kbd><kbd>↓</kbd><kbd>k</kbd><kbd>↑</kbd></span>
                        <span>{{ t('block_editor.shortcuts.move_between') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>↵</kbd><kbd>e</kbd></span>
                        <span>{{ t('block_editor.shortcuts.open') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>/</kbd></span>
                        <span>{{ t('block_editor.shortcuts.add_task') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>⌘K</kbd></span>
                        <span>{{ t('block_editor.shortcuts.command_palette') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>⌘[</kbd><kbd>⌘]</kbd></span>
                        <span>{{ t('block_editor.shortcuts.switch_tab') }}</span>
                    </div>
                </div>
                <div class="block-editor-shortcuts-col">
                    <span class="block-editor-shortcuts-heading">{{ t('block_editor.shortcuts.group_edit') }}</span>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>d</kbd></span>
                        <span>{{ t('block_editor.duplicate') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>⌫</kbd></span>
                        <span>{{ t('block_editor.delete') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>a</kbd><kbd>+</kbd></span>
                        <span>{{ t('block_editor.shortcuts.add_after') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>⌥↑</kbd><kbd>⌥↓</kbd></span>
                        <span>{{ t('block_editor.shortcuts.reorder') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>␣</kbd><kbd>←</kbd><kbd>→</kbd></span>
                        <span>{{ t('block_editor.shortcuts.collapse_expand') }}</span>
                    </div>
                    <div class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys"><kbd>?</kbd></span>
                        <span>{{ t('block_editor.shortcuts.toggle') }}</span>
                    </div>
                </div>
            </div>
        </KsDialog>

        <button
            v-if="!dockTabs.length"
            type="button"
            class="block-editor-help"
            :aria-label="t('block_editor.shortcuts.title')"
            :title="t('block_editor.shortcuts.title')"
            data-test="block-editor-help"
            @click="shortcutsOpen = true"
        >
            <Keyboard class="block-editor-help-ico" />
            <kbd class="block-editor-help-kbd">?</kbd>
        </button>
    </div>
</template>

<script setup lang="ts">
    import {computed, nextTick, onMounted, provide, ref, watch, type Component} from "vue"
    import {useI18n} from "vue-i18n"
    import TriggerIcon from "vue-material-design-icons/LightningBoltOutline.vue"
    import TasksIcon from "vue-material-design-icons/FormatListBulleted.vue"
    import ErrorIcon from "vue-material-design-icons/AlertCircleOutline.vue"
    import FinallyIcon from "vue-material-design-icons/FlagOutline.vue"
    import SuggestedIcon from "vue-material-design-icons/Creation.vue"
    import AppsIcon from "vue-material-design-icons/ViewGridOutline.vue"
    import RecentIcon from "vue-material-design-icons/History.vue"
    import ChevronLeft from "vue-material-design-icons/ChevronLeft.vue"
    import Close from "vue-material-design-icons/Close.vue"
    import Keyboard from "vue-material-design-icons/Keyboard.vue"

    import {KsTaskIcon, KsIconButton, vKsLoading} from "@kestra-io/design-system"
    import {flowYamlUtils} from "@kestra-io/topology"
    import {useRoute, useRouter} from "vue-router"

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
    const focusedId = ref<string | undefined>()
    const shortcutsOpen = ref(false)
    const internalSelectedId = ref<string | undefined>(props.selectedId)

    onMounted(() => editorEl.value?.focus())

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

    const dockTabs = ref<EditingBlock[]>([])
    const activeTab = computed(() => dockTabs.value.find(tab => tab.id === selectedId.value))

    const splitCount = ref(1)
    const activationOrder = ref<string[]>([])

    function touchActivation(id: string) {
        activationOrder.value = [id, ...activationOrder.value.filter(other => other !== id)]
    }

    const tiledIds = computed<Set<string>>(() => {
        const max = Math.min(splitCount.value, dockTabs.value.length)
        return new Set(activationOrder.value.slice(0, max))
    })

    provide(BLOCK_SCHEMA_PATH_INJECTION_KEY, computed(() => {
        const root = pluginsStore.flowSchema?.$ref
        if (!root) return ""
        const section = activeTab.value?.section ?? "tasks"
        return `${root}/properties/${section}/items`
    }))

    function openTab(tab: EditingBlock) {
        const existing = dockTabs.value.find(t => t.id === tab.id)
        if (existing) {
            existing.section = tab.section
            existing.data = tab.data
            existing.path = tab.path
        } else {
            dockTabs.value = [...dockTabs.value, tab]
        }
        selectedId.value = tab.id
        touchActivation(tab.id)
    }

    function activateTab(id: string) {
        selectedId.value = id
        touchActivation(id)
    }

    function focusPane(id: string) {
        if (selectedId.value !== id) activateTab(id)
    }

    watch(() => activeTab.value?.data?.type, (type) => {
        if (type) pluginsStore.load?.({cls: String(type)})
    })

    function closeTab(id: string) {
        if (!dockTabs.value.some(tab => tab.id === id)) return
        dockTabs.value = dockTabs.value.filter(tab => tab.id !== id)
        activationOrder.value = activationOrder.value.filter(other => other !== id)
        if (selectedId.value === id) {
            selectedId.value = activationOrder.value[0]
        }
    }

    function closeAllTabs() {
        dockTabs.value = []
        activationOrder.value = []
        selectedId.value = undefined
    }

    const route = useRoute()
    const router = useRouter()
    const DOCK_SECTIONS: BlockSection[] = ["tasks", "triggers", "errors", "finally"]
    let restoringDock = false

    const dockInputsCollapsed = ref(false)
    const dockOutputCollapsed = ref(false)
    const dockDocOpen = ref(false)

    const dockStateKey = computed(() => [
        dockTabs.value.map(tab => `${tab.section}:${tab.id}`).join(","),
        selectedId.value ?? "",
        splitCount.value,
        dockInputsCollapsed.value,
        dockOutputCollapsed.value,
        dockDocOpen.value,
    ].join("|"))

    watch(dockStateKey, () => {
        if (restoringDock) return
        const query: Record<string, unknown> = {...route.query}
        const tabs = dockTabs.value.map(tab => `${tab.section}:${tab.id}`).join(",")
        if (tabs) query.tabs = tabs
        else delete query.tabs
        if (selectedId.value) query.tab = selectedId.value
        else delete query.tab
        if (tabs && splitCount.value > 1) query.cols = String(splitCount.value)
        else delete query.cols
        const collapsed = [
            dockInputsCollapsed.value ? "inputs" : "",
            dockOutputCollapsed.value ? "output" : "",
        ].filter(Boolean).join(",")
        if (tabs && collapsed) query.collapsed = collapsed
        else delete query.collapsed
        if (tabs && dockDocOpen.value) query.doc = "1"
        else delete query.doc
        router.replace({query}).catch(() => {})
    })

    const dockRestored = ref(false)

    watch(parsedFlow, (flow) => {
        if (dockRestored.value || !flow) return
        dockRestored.value = true
        const tabsParam = typeof route.query.tabs === "string" ? route.query.tabs : ""
        if (!tabsParam) return
        restoringDock = true
        for (const token of tabsParam.split(",")) {
            const separator = token.indexOf(":")
            if (separator < 0) continue
            const section = token.slice(0, separator) as BlockSection
            const id = token.slice(separator + 1)
            if (!id || !DOCK_SECTIONS.includes(section)) continue
            const block = sectionList(section).find(item => String(item.id) === id)
            if (block) openTab({id, section, data: block})
        }
        const active = route.query.tab
        if (typeof active === "string" && dockTabs.value.some(tab => tab.id === active)) {
            activateTab(active)
        }
        const cols = Number(route.query.cols)
        if (cols >= 1 && cols <= 3) splitCount.value = cols
        const collapsed = typeof route.query.collapsed === "string" ? route.query.collapsed.split(",") : []
        dockInputsCollapsed.value = collapsed.includes("inputs")
        dockOutputCollapsed.value = collapsed.includes("output")
        dockDocOpen.value = route.query.doc === "1"
        nextTick(() => {
            restoringDock = false
        })
    }, {immediate: true})

    function selectBlock(section: BlockSection, block: Record<string, unknown>) {
        const strId = block.id != null ? String(block.id) : undefined
        if (!strId) return
        openTab({id: strId, section, data: block})
    }

    function openNestedEdit(path: string) {
        const blockYaml = flowYamlUtils.extractBlockWithPath({source: flowYaml.value, path})
        if (!blockYaml) return

        const parsed = flowYamlUtils.parse<Record<string, unknown>>(blockYaml)
        if (!parsed || !parsed.id) return

        const section: BlockSection = path.startsWith("errors") ? "errors" : path.startsWith("finally") ? "finally" : "tasks"
        openTab({id: String(parsed.id), section, data: parsed, path})
    }

    const onEditTimeout = ref<ReturnType<typeof setTimeout>>()

    function applyYaml(newYaml: string) {
        flowStore.flowYaml = newYaml
        clearTimeout(onEditTimeout.value)
        onEditTimeout.value = setTimeout(() => {
            flowStore.onEdit({source: newYaml, topologyVisible: true})
        }, 1000)
    }

    function onTaskEdited(tab: EditingBlock, newContent: string) {
        const {section, id, path} = tab
        if (path) {
            applyYaml(updateBlockAtPath(flowYaml.value, path, newContent))
        } else {
            applyYaml(updateBlock(flowYaml.value, section, id, newContent))
        }
    }

    function onDelete(section: BlockSection, id: unknown) {
        if (typeof id !== "string") return
        const newYaml = deleteBlock(flowYaml.value, section, id)
        closeTab(id)
        applyYaml(newYaml)
    }

    function onDeleteAtPath(path: string) {
        const newYaml = deleteBlockAtPath(flowYaml.value, path)
        const blockYaml = flowYamlUtils.extractBlockWithPath({source: flowYaml.value, path})
        if (blockYaml) {
            const parsed = flowYamlUtils.parse<Record<string, unknown>>(blockYaml)
            if (parsed?.id) closeTab(String(parsed.id))
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
    const debouncedSearch = ref("")
    let searchTimer: ReturnType<typeof setTimeout> | undefined
    watch(taskPickerSearch, (value) => {
        clearTimeout(searchTimer)
        searchTimer = setTimeout(() => {
            debouncedSearch.value = value
        }, 150)
    })
    const hasSearch = computed(() => debouncedSearch.value.trim().length > 0)
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
        clearTimeout(searchTimer)
        debouncedSearch.value = ""
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
        const search = debouncedSearch.value.trim().toLowerCase()
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
        if (hasSearch.value) return filteredCommonTypes.value
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
        const tab = activeTab.value
        if (!tab?.path) return
        const match = tab.path.match(/^tasks\[(\d+)\]/)
        if (!match) return
        const movedIndex = parseInt(match[1], 10)
        const lo = Math.min(from, to)
        const hi = Math.max(from, to)
        if (movedIndex >= lo && movedIndex <= hi) closeTab(tab.id)
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

    function navigableCards(): HTMLElement[] {
        if (!editorEl.value) return []
        return [...editorEl.value.querySelectorAll<HTMLElement>("[data-block-id]")].filter(el => el.offsetParent !== null)
    }

    function highlightFocused() {
        navigableCards().forEach(el =>
            el.classList.toggle("block-kbd-focused", el.getAttribute("data-block-id") === focusedId.value),
        )
    }

    function focusedCard(): HTMLElement | undefined {
        return navigableCards().find(el => el.getAttribute("data-block-id") === focusedId.value)
    }

    function moveFocus(direction: 1 | -1) {
        const cards = navigableCards()
        if (!cards.length) return
        const ids = cards.map(el => el.getAttribute("data-block-id") ?? "")
        const current = focusedId.value ? ids.indexOf(focusedId.value) : -1
        const next = current < 0 ? (direction > 0 ? 0 : cards.length - 1) : (current + direction + cards.length) % cards.length
        focusedId.value = ids[next] || undefined
        cards[next].scrollIntoView({block: "nearest"})
        nextTick(highlightFocused)
    }

    function openFocused() {
        const card = focusedCard()
        if (!card) return
        if (card.matches("[data-test='block-card']")) {
            card.click()
        } else {
            card.querySelector<HTMLElement>("[data-test='flowable-cluster-header']")?.click()
        }
    }

    function actionInFocused(selector: string) {
        focusedCard()?.querySelector<HTMLElement>(selector)?.click()
    }

    function addAfterFocused() {
        const sectionEl = focusedCard()?.closest<HTMLElement>("[data-test^='block-section-']")
        const section = sectionEl?.getAttribute("data-test")?.replace("block-section-", "") as BlockSection | undefined
        openTaskPicker(section ?? "tasks")
    }

    function cycleTab(direction: 1 | -1) {
        if (dockTabs.value.length < 2) return
        const ids = dockTabs.value.map(tab => tab.id)
        const current = selectedId.value ? ids.indexOf(selectedId.value) : -1
        activateTab(ids[current < 0 ? 0 : (current + direction + ids.length) % ids.length])
    }

    function onEditorKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement
        const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

        if ((event.metaKey || event.ctrlKey) && (event.key === "[" || event.key === "]")) {
            event.preventDefault()
            cycleTab(event.key === "]" ? 1 : -1)
            return
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault()
            openTaskPicker("tasks")
            return
        }
        if (event.key === "Escape") {
            if (shortcutsOpen.value) shortcutsOpen.value = false
            else if (taskPickerVisible.value) taskPickerVisible.value = false
            return
        }
        if (typing || event.metaKey || event.ctrlKey) return

        if (event.key === "?") {
            event.preventDefault()
            shortcutsOpen.value = !shortcutsOpen.value
        } else if (event.key === "/" && !taskPickerVisible.value) {
            event.preventDefault()
            openTaskPicker("tasks")
        } else if (event.key === "j" || (event.key === "ArrowDown" && !event.altKey)) {
            event.preventDefault()
            moveFocus(1)
        } else if (event.key === "k" || (event.key === "ArrowUp" && !event.altKey)) {
            event.preventDefault()
            moveFocus(-1)
        } else if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault()
            moveSelected("down")
        } else if (event.altKey && event.key === "ArrowUp") {
            event.preventDefault()
            moveSelected("up")
        } else if (event.key === "Enter" || event.key === "e" || event.key === "E") {
            if (focusedId.value) {
                event.preventDefault()
                openFocused()
            }
        } else if (event.key === "d" || event.key === "D") {
            if (focusedId.value) {
                event.preventDefault()
                actionInFocused("[data-test='block-card-duplicate']")
            } else if (selectedId.value) {
                event.preventDefault()
                duplicateSelected()
            }
        } else if (event.key === "Delete" || event.key === "Backspace") {
            if (focusedId.value) {
                event.preventDefault()
                actionInFocused("[data-test='block-card-delete']")
                focusedId.value = undefined
            } else if (selectedId.value) {
                event.preventDefault()
                deleteSelected()
            }
        } else if (event.key === "a" || event.key === "A" || event.key === "+") {
            event.preventDefault()
            addAfterFocused()
        } else if (event.key === " " || event.key === "ArrowRight" || event.key === "ArrowLeft") {
            if (focusedId.value) {
                event.preventDefault()
                actionInFocused("[data-test='flowable-cluster-header']")
            }
        }
    }

    function deleteSelected() {
        const tab = activeTab.value
        if (!selectedId.value || !tab) return
        if (tab.path) {
            onDeleteAtPath(tab.path)
        } else {
            onDelete(tab.section, tab.id)
        }
    }

    function duplicateSelected() {
        const tab = activeTab.value
        if (!selectedId.value || !tab) return
        if (tab.path) {
            onDuplicateAtPath(tab.path)
        } else {
            onDuplicate(tab.section, tab.id)
        }
    }

    function moveSelected(direction: "up" | "down") {
        const tab = activeTab.value
        if (!selectedId.value || !tab) return
        const path = tab.path
        if (!path) {
            const section = tab.section
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
                tab.path = `${match[1]}[${newIndex}]`
            }
            applyYaml(newYaml)
        }
    }
</script>

<style scoped lang="scss">
    .block-editor {
        position: relative;
        height: 100%;
        overflow: hidden;
        background: var(--ks-bg-base);
    }

    .block-editor-split {
        height: 100%;
    }

    .block-editor-main {
        height: 100%;
        overflow-y: auto;
        padding: var(--ks-spacing-6) var(--ks-spacing-4);
    }

    .block-editor-dock {
        height: 100%;
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: var(--ks-spacing-4);
    }

    .block-editor-dock-tabbar {
        display: flex;
        align-items: stretch;
        gap: var(--ks-spacing-1);
        flex-shrink: 0;
        overflow-x: auto;
    }

    .block-editor-dock-tab {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        max-width: 200px;
        padding: var(--ks-spacing-2) var(--ks-spacing-1) var(--ks-spacing-2) var(--ks-spacing-3);
        background: var(--ks-bg-base);
        border: 1px solid var(--ks-border-subtle);
        border-bottom: none;
        border-radius: var(--ks-radius-base) var(--ks-radius-base) 0 0;
        cursor: pointer;
        color: var(--ks-text-secondary);
        transition: background-color 0.12s, color 0.12s;
    }

    .block-editor-dock-tab:hover {
        background: var(--ks-bg-surface);
        color: var(--ks-text-primary);
    }

    .block-editor-dock-tab--active {
        background: var(--ks-bg-surface);
        color: var(--ks-text-primary);
        box-shadow: inset 0 2px 0 var(--ks-text-link);
    }

    .block-editor-dock-tab--tiled {
        background: var(--ks-bg-surface);
        color: var(--ks-text-primary);
    }

    .block-editor-dock-split {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        flex-shrink: 0;
        padding: var(--ks-spacing-1);
        background: var(--ks-bg-tag);
        border-radius: var(--ks-radius-base);
    }

    .block-editor-dock-split-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--ks-spacing-1) var(--ks-spacing-2);
        border: none;
        background: transparent;
        color: var(--ks-icon-default);
        border-radius: var(--ks-radius-sm);
        cursor: pointer;
        transition: background-color 0.12s, color 0.12s;
    }

    .block-editor-dock-split-btn:hover:not(:disabled) {
        color: var(--ks-text-primary);
    }

    .block-editor-dock-split-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .block-editor-dock-split-btn--active {
        background: var(--ks-bg-surface);
        color: var(--ks-text-link);
    }

    .block-editor-dock-split-glyph {
        display: flex;
        gap: 1.5px;
        width: 18px;
        height: 13px;
        padding: 2px;
        border: 1.5px solid currentColor;
        border-radius: 3px;
    }

    .block-editor-dock-split-col {
        flex: 1;
        background: currentColor;
        border-radius: 1px;
    }

    .block-editor-dock-tab-ico {
        flex-shrink: 0;
        width: var(--ks-icon-size-sm);
        height: var(--ks-icon-size-sm);
    }

    .block-editor-dock-tab-id {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--ks-font-size-sm);
        font-family: var(--ks-font-family-mono);
    }

    .block-editor-dock-tab-close {
        flex-shrink: 0;
    }

    .block-editor-dock-tabbar-spacer {
        flex: 1;
        min-width: var(--ks-spacing-2);
    }

    .block-editor-dock-body {
        flex: 1;
        min-height: 0;
        display: flex;
        gap: var(--ks-spacing-3);
    }

    .block-editor-dock-pane {
        flex: 1;
        min-width: 0;
        min-height: 0;
    }

    .block-editor-dock-pane--active {
        box-shadow: 0 0 0 1px var(--ks-text-link);
        border-radius: var(--ks-radius-lg);
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

    .block-editor-shortcuts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ks-spacing-5);
    }

    .block-editor-shortcuts-col {
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-2);
    }

    .block-editor-shortcuts-heading {
        font-size: var(--ks-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ks-text-secondary);
    }

    .block-editor-shortcut {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ks-spacing-3);
        font-size: var(--ks-font-size-sm);
        color: var(--ks-text-primary);
    }

    .block-editor-shortcut-keys {
        display: inline-flex;
        gap: var(--ks-spacing-1);
        flex-shrink: 0;
    }

    .block-editor-shortcut-keys kbd {
        font-family: var(--ks-font-family-mono);
        font-size: var(--ks-font-size-xs);
        background: var(--ks-bg-tag-inactive);
        border: 1px solid var(--ks-border-subtle);
        border-radius: var(--ks-radius-sm);
        padding: 1px var(--ks-spacing-1);
        color: var(--ks-text-secondary);
        min-width: 18px;
        text-align: center;
    }

    .block-editor-help {
        position: absolute;
        right: var(--ks-spacing-4);
        bottom: var(--ks-spacing-4);
        z-index: 10;
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        padding: var(--ks-spacing-1) var(--ks-spacing-2);
        background: var(--ks-bg-elevated);
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-lg);
        box-shadow: var(--ks-shadow-sm);
        color: var(--ks-text-secondary);
        cursor: pointer;
        transition: color 0.15s, border-color 0.15s, background-color 0.15s;
    }

    .block-editor-help:hover {
        color: var(--ks-text-primary);
        border-color: var(--ks-border-strong);
        background: var(--ks-bg-surface);
    }

    .block-editor-help:focus-visible {
        outline: 2px solid var(--ks-border-focus);
        outline-offset: 2px;
    }

    .block-editor-help-ico {
        display: flex;
        font-size: 1rem;
    }

    .block-editor-help-kbd {
        font-family: var(--ks-font-family-mono);
        font-size: var(--ks-font-size-xs);
        background: var(--ks-bg-tag-inactive);
        border: 1px solid var(--ks-border-subtle);
        border-radius: var(--ks-radius-sm);
        padding: 1px var(--ks-spacing-1);
        min-width: 18px;
        text-align: center;
    }
</style>
