<template>
    <div
        ref="editorEl"
        class="block-editor"
        data-test="block-editor"
        @focusin="onCanvasFocusIn"
    >
        <KsSplitter class="block-editor-split">
            <KsSplitterPanel min="18%">
                <div class="block-editor-main">
                    <!-- Roving-tabindex entry point: while no card holds the
                    keyboard focus yet, the canvas itself is the composite's
                    single Tab stop and delegates focus to its first card. -->
                    <div
                        class="block-editor-canvas"
                        :tabindex="focusedId ? -1 : 0"
                        role="group"
                        :aria-label="t('block_editor.canvas_aria')"
                        @focus="onCanvasEntryFocus"
                    >
                        <BlockSectionCard
                            name="triggers"
                            :title="t('no_code.sections.triggers')"
                            :icon="TriggerIcon"
                            :count="parsedTriggers.length"
                            :addLabel="t('block_editor.add_trigger')"
                            @add="(e) => openTaskPicker('triggers', e)"
                        >
                            <div class="block-section-list" data-test="block-editor-trigger-list">
                                <template v-for="(trigger, index) in parsedTriggers" :key="resolveBlockDomId(parsedTriggers, index)">
                                    <BlockCard
                                        :block="trigger"
                                        :selected="activeSelectedId === String(trigger.id)"
                                        :focused="focusedId === resolveBlockDomId(parsedTriggers, index)"
                                        :draggable="true"
                                        :dragOver="triggerDragOverIndex === index"
                                        :icons="pluginsStore.icons"
                                        :data-block-id="resolveBlockDomId(parsedTriggers, index)"
                                        @select="selectBlock('triggers', trigger)"
                                        @delete="onDelete('triggers', trigger.id)"
                                        @duplicate="onDuplicate('triggers', trigger.id)"
                                        @drag-start="handleTriggerDragStart($event, index)"
                                        @drag-over="handleTriggerDragOver($event, index)"
                                        @drop="handleTriggerDrop($event, index)"
                                        @drag-end="handleTriggerDragEnd"
                                    />
                                    <BlockInsertionCaret v-if="focusedId === resolveBlockDomId(parsedTriggers, index)" />
                                </template>
                                <BlockEmptyDrop
                                    v-if="parsedTriggers.length === 0"
                                    variant="empty"
                                    :label="t('block_editor.trigger_noun')"
                                    :data-block-id="sectionSentinelId('triggers')"
                                    :class="{'block-kbd-focused': focusedId === sectionSentinelId('triggers')}"
                                    :tabindex="focusedId === sectionSentinelId('triggers') ? 0 : -1"
                                    :aria-selected="focusedId === sectionSentinelId('triggers')"
                                    @add="(e) => openTaskPicker('triggers', e)"
                                />
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
                                    tabindex="-1"
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
                                <template v-for="(task, index) in parsedTasks" :key="resolveBlockDomId(parsedTasks, index)">
                                    <FlowableClusterCard
                                        v-if="isFlowable(task)"
                                        :block="task"
                                        :path="`tasks[${index}]`"
                                        :icons="pluginsStore.icons"
                                        :selectedId="activeSelectedId"
                                        :focusedId="focusedId"
                                        :domId="resolveBlockDomId(parsedTasks, index)"
                                        :depth="0"
                                        :data-block-id="resolveBlockDomId(parsedTasks, index)"
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
                                        :selected="activeSelectedId === String(task.id)"
                                        :focused="focusedId === resolveBlockDomId(parsedTasks, index)"
                                        :draggable="true"
                                        :dragOver="taskDragOverIndex === index"
                                        :icons="pluginsStore.icons"
                                        :data-block-id="resolveBlockDomId(parsedTasks, index)"
                                        @select="selectBlock('tasks', task)"
                                        @delete="onDelete('tasks', task.id)"
                                        @duplicate="onDuplicate('tasks', task.id)"
                                        @drag-start="handleTaskDragStart($event, index)"
                                        @drag-over="handleTaskDragOver($event, index)"
                                        @drop="handleTaskDrop($event, index)"
                                        @drag-end="handleTaskDragEnd"
                                    />
                                    <BlockInsertionCaret v-if="focusedId === resolveBlockDomId(parsedTasks, index)" />
                                </template>

                                <BlockEmptyDrop
                                    v-if="parsedTasks.length === 0"
                                    variant="empty"
                                    :label="t('block_editor.task_noun')"
                                    :hint="t('block_editor.empty_add_hint')"
                                    :data-block-id="sectionSentinelId('tasks')"
                                    :class="{'block-kbd-focused': focusedId === sectionSentinelId('tasks')}"
                                    :tabindex="focusedId === sectionSentinelId('tasks') ? 0 : -1"
                                    :aria-selected="focusedId === sectionSentinelId('tasks')"
                                    @add="(e) => openTaskPicker('tasks', e)"
                                />
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
                                    tabindex="-1"
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
                                <template v-for="(task, index) in flowLevelErrors" :key="resolveBlockDomId(flowLevelErrors, index)">
                                    <FlowableClusterCard
                                        v-if="isFlowable(task)"
                                        :block="task"
                                        :path="`errors[${index}]`"
                                        :icons="pluginsStore.icons"
                                        :selectedId="activeSelectedId"
                                        :focusedId="focusedId"
                                        :domId="resolveBlockDomId(flowLevelErrors, index)"
                                        :depth="0"
                                        :data-block-id="resolveBlockDomId(flowLevelErrors, index)"
                                        data-test="block-card"
                                        @select="openNestedEdit"
                                        @delete="onDeleteAtPath"
                                        @duplicate="onDuplicateAtPath"
                                        @add-at-path="openTaskPickerAtPath"
                                    />
                                    <BlockCard
                                        v-else
                                        :block="task"
                                        :selected="activeSelectedId === String(task.id)"
                                        :focused="focusedId === resolveBlockDomId(flowLevelErrors, index)"
                                        :icons="pluginsStore.icons"
                                        :data-block-id="resolveBlockDomId(flowLevelErrors, index)"
                                        @select="selectBlock('errors', task)"
                                        @delete="onDelete('errors', task.id)"
                                        @duplicate="onDuplicate('errors', task.id)"
                                    />
                                    <BlockInsertionCaret v-if="focusedId === resolveBlockDomId(flowLevelErrors, index)" />
                                </template>
                                <BlockEmptyDrop
                                    v-if="flowLevelErrors.length === 0"
                                    variant="empty"
                                    :label="t('block_editor.error_task_noun')"
                                    :data-block-id="sectionSentinelId('errors')"
                                    :class="{'block-kbd-focused': focusedId === sectionSentinelId('errors')}"
                                    :tabindex="focusedId === sectionSentinelId('errors') ? 0 : -1"
                                    :aria-selected="focusedId === sectionSentinelId('errors')"
                                    @add="(e) => openTaskPicker('errors', e)"
                                />
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
                                    tabindex="-1"
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
                                <template v-for="(task, index) in flowLevelFinally" :key="resolveBlockDomId(flowLevelFinally, index)">
                                    <FlowableClusterCard
                                        v-if="isFlowable(task)"
                                        :block="task"
                                        :path="`finally[${index}]`"
                                        :icons="pluginsStore.icons"
                                        :selectedId="activeSelectedId"
                                        :focusedId="focusedId"
                                        :domId="resolveBlockDomId(flowLevelFinally, index)"
                                        :depth="0"
                                        :data-block-id="resolveBlockDomId(flowLevelFinally, index)"
                                        data-test="block-card"
                                        @select="openNestedEdit"
                                        @delete="onDeleteAtPath"
                                        @duplicate="onDuplicateAtPath"
                                        @add-at-path="openTaskPickerAtPath"
                                    />
                                    <BlockCard
                                        v-else
                                        :block="task"
                                        :selected="activeSelectedId === String(task.id)"
                                        :focused="focusedId === resolveBlockDomId(flowLevelFinally, index)"
                                        :icons="pluginsStore.icons"
                                        :data-block-id="resolveBlockDomId(flowLevelFinally, index)"
                                        @select="selectBlock('finally', task)"
                                        @delete="onDelete('finally', task.id)"
                                        @duplicate="onDuplicate('finally', task.id)"
                                    />
                                    <BlockInsertionCaret v-if="focusedId === resolveBlockDomId(flowLevelFinally, index)" />
                                </template>
                                <BlockEmptyDrop
                                    v-if="flowLevelFinally.length === 0"
                                    variant="empty"
                                    :label="t('block_editor.task_noun')"
                                    :data-block-id="sectionSentinelId('finally')"
                                    :class="{'block-kbd-focused': focusedId === sectionSentinelId('finally')}"
                                    :tabindex="focusedId === sectionSentinelId('finally') ? 0 : -1"
                                    :aria-selected="focusedId === sectionSentinelId('finally')"
                                    @add="(e) => openTaskPicker('finally', e)"
                                />
                                <BlockEmptyDrop
                                    v-else
                                    variant="inline"
                                    tabindex="-1"
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
                                'block-editor-dock-tab--active': activeSelectedId === tab.id,
                                'block-editor-dock-tab--tiled': tiledIds.has(tab.id) && activeSelectedId !== tab.id,
                            }"
                            :aria-selected="activeSelectedId === tab.id"
                            :data-test="`block-editor-dock-tab-${tab.id}`"
                            @click="activateTab(tab.id)"
                            @keydown.enter="activateTab(tab.id)"
                            @keydown.space.prevent="activateTab(tab.id)"
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
                        <!-- With a single pane visible, the tabbar above already labels it,
                        so each pane's own tabstrip stays hidden. Once split view tiles 2+
                        panes side by side, the tabbar is no longer next to the content it
                        describes — showing each pane's own label keeps the name next to its
                        own section (law of proximity) instead of only at the top of the dock. -->
                        <TaskEdit
                            v-for="tab in dockTabs"
                            v-show="tiledIds.has(tab.id)"
                            :key="tab.id"
                            class="block-editor-dock-pane"
                            :class="{'block-editor-dock-pane--active': activeSelectedId === tab.id && tiledIds.size > 1}"
                            :data-dock-pane-id="tab.id"
                            :task="tab.data"
                            :section="tab.section"
                            :flowId="flowId"
                            :namespace="namespace"
                            :isHidden="true"
                            presentation="panel"
                            :hideTabstrip="tiledIds.size <= 1"
                            v-model:inputsCollapsed="tab.inputsCollapsed"
                            v-model:outputCollapsed="tab.outputCollapsed"
                            v-model:docOpen="tab.docOpen"
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
                >
                    <p class="block-editor-picker-context">{{ t('block_editor.inserting_into', {section: sectionLabel}) }}</p>

                    <KsInput
                        ref="pickerSearchInput"
                        v-model="taskPickerSearch"
                        :placeholder="t('block_editor.search_task_placeholder')"
                        :aria-label="t('block_editor.search_task_placeholder')"
                        aria-controls="block-editor-picker-listbox"
                        :aria-activedescendant="pickerFocusedIndex >= 0 ? `block-editor-picker-option-${pickerFocusedIndex}` : undefined"
                        clearable
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
                <div v-for="group in shortcutGroups" :key="group.group" class="block-editor-shortcuts-col">
                    <span class="block-editor-shortcuts-heading">{{ t(`block_editor.shortcuts.group_${group.group}`) }}</span>
                    <div v-for="binding in group.bindings" :key="binding.id" class="block-editor-shortcut">
                        <span class="block-editor-shortcut-keys">
                            <kbd v-for="key in displayKeys(binding.keys)" :key="key">{{ key }}</kbd>
                            <template v-if="binding.alt?.length">
                                <span class="block-editor-shortcut-or">{{ t('block_editor.shortcuts.or') }}</span>
                                <kbd v-for="key in displayKeys(binding.alt)" :key="key">{{ key }}</kbd>
                            </template>
                        </span>
                        <span>{{ t(binding.i18nKey) }}</span>
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

        <div v-if="!shortcutsOpen" class="block-editor-footer" role="status" data-test="block-editor-footer">
            <span class="block-editor-footer-context">{{ footerContext }}</span>
            <span v-for="hint in footerHints" :key="hint.id" class="block-editor-footer-hint">
                <kbd v-for="key in displayKeys(hint.keys)" :key="key">{{ key }}</kbd>
                {{ t(hint.i18nKey) }}
            </span>
        </div>

        <Transition name="block-editor-undo">
            <div v-if="undoState" class="block-editor-undo" role="status" aria-live="polite">
                <span class="block-editor-undo-label">{{ undoState.label }}</span>
                <button
                    type="button"
                    class="block-editor-undo-btn"
                    data-test="block-editor-undo"
                    @click="performUndo"
                >
                    {{ t("block_editor.undo") }}
                </button>
            </div>
        </Transition>

        <BlockCommandMenu
            v-if="commandMenuOpen"
            :items="commandMenuItems"
            :contextLabel="commandMenuContextLabel"
            @close="commandMenuOpen = false"
        />
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
    import Close from "vue-material-design-icons/Close.vue"
    import Keyboard from "vue-material-design-icons/Keyboard.vue"
    import ContentCopy from "vue-material-design-icons/ContentCopy.vue"
    import DeleteOutline from "vue-material-design-icons/DeleteOutline.vue"
    import ArrowRightBold from "vue-material-design-icons/ArrowRightBold.vue"
    import ContentSave from "vue-material-design-icons/ContentSave.vue"
    import PlusCircleOutline from "vue-material-design-icons/PlusCircleOutline.vue"
    import OpenInNew from "vue-material-design-icons/OpenInNew.vue"

    import {KsTaskIcon, KsIconButton, KsInput, KsMessageBox, vKsLoading} from "@kestra-io/design-system"
    import {flowYamlUtils} from "@kestra-io/topology"
    import {useRoute, useRouter, type LocationQueryRaw} from "vue-router"

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
        resolveBlockDomId,
        updateBlock,
        updateBlockAtPath,
        type BlockSection,
    } from "../../../utils/flowableBlockOps"
    import {useDragAndDrop} from "../../../composables/useDragAndDrop"
    import BlockCard from "./BlockCard.vue"
    import BlockSectionCard from "./BlockSectionCard.vue"
    import BlockEmptyDrop from "./BlockEmptyDrop.vue"
    import BlockInsertionCaret from "./BlockInsertionCaret.vue"
    import BlockCommandMenu, {type BlockCommandMenuItem} from "./BlockCommandMenu.vue"
    import FlowableClusterCard from "./FlowableClusterCard.vue"
    import TaskEdit from "../../flows/TaskEdit.vue"
    import {BLOCK_SCHEMA_PATH_INJECTION_KEY} from "../injectionKeys"
    import {useBlockEditorKeyboard} from "./useBlockEditorKeyboard"
    import {BLOCK_EDITOR_KEYMAP, blockEditorKeymapByGroup, findBlockEditorBinding, type BlockEditorKeymapGroup} from "./keymap"

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

    function sectionDisplayLabel(section: BlockSection): string {
        if (section === "triggers") return t("no_code.sections.triggers")
        if (section === "errors") return t("block_editor.lane_errors")
        if (section === "finally") return t("block_editor.lane_finally")
        return t("no_code.sections.tasks")
    }

    // An empty section has no task to anchor focus on, so it renders its
    // BlockEmptyDrop placeholder with this sentinel as its data-block-id —
    // keyboard nav (j/k, "Go to X") can then land on it like any other card,
    // and "a"/Enter there opens the picker for that section instead of acting
    // on a real block.
    function sectionSentinelId(section: BlockSection): string {
        return `__section:${section}`
    }

    function sectionFromSentinel(id: string | undefined): BlockSection | undefined {
        if (!id?.startsWith("__section:")) return undefined
        const section = id.slice("__section:".length) as BlockSection
        return DOCK_SECTIONS.includes(section) ? section : undefined
    }

    // Same idea as the section sentinel, but for an empty lane INSIDE a
    // flowable block (e.g. a Sequential task's own, currently-empty "errors"
    // lane) — that lane doesn't map to a fixed BlockSection, so it carries
    // its own parent path instead (see BranchLane.vue's data-block-id).
    function parentPathFromLaneSentinel(id: string | undefined): string | undefined {
        if (!id?.startsWith("__lane:")) return undefined
        return id.slice("__lane:".length)
    }

    // Mirrors BranchLane.vue's own laneLabel computed, but derived from a
    // parent path (e.g. "tasks[0].errors" or "tasks[0].cases.foo") since the
    // lane sentinel only carries the path, not the lane name directly.
    function laneDisplayLabelFromPath(parentPath: string): string {
        const casesMatch = parentPath.match(/\.cases\.([^.]+)$/)
        if (casesMatch) return t("block_editor.lane_case", {key: casesMatch[1]})
        const laneName = parentPath.slice(parentPath.lastIndexOf(".") + 1)
        if (laneName === "then") return t("block_editor.lane_then")
        if (laneName === "else") return t("block_editor.lane_else")
        if (laneName === "errors") return t("block_editor.lane_errors")
        if (laneName === "finally") return t("block_editor.lane_finally")
        if (laneName === "defaults") return t("block_editor.lane_defaults")
        if (laneName === "tasks") return t("block_editor.lane_tasks")
        return laneName.toUpperCase()
    }

    const NESTED_BLOCK_KEYS = ["tasks", "then", "else", "finally", "errors", "defaults"]

    function findNestedPath(items: Record<string, unknown>[], id: string, prefix: string): string | undefined {
        for (let index = 0; index < items.length; index++) {
            const item = items[index]
            if (!item || typeof item !== "object") continue
            const path = `${prefix}[${index}]`
            if (String(item.id) === id) return path
            for (const key of NESTED_BLOCK_KEYS) {
                const branch = item[key]
                if (Array.isArray(branch)) {
                    const found = findNestedPath(branch as Record<string, unknown>[], id, `${path}.${key}`)
                    if (found) return found
                }
            }
            const cases = item.cases
            if (cases && typeof cases === "object" && !Array.isArray(cases)) {
                for (const caseKey of Object.keys(cases as Record<string, unknown>)) {
                    const branch = (cases as Record<string, unknown>)[caseKey]
                    if (Array.isArray(branch)) {
                        const found = findNestedPath(branch as Record<string, unknown>[], id, `${path}.cases.${caseKey}`)
                        if (found) return found
                    }
                }
            }
        }
        return undefined
    }

    const editorEl = ref<HTMLElement>()
    const focusedId = ref<string | undefined>()
    const shortcutsOpen = ref(false)
    const commandMenuOpen = ref(false)
    const confirmDialogOpen = ref(false)
    let lastConfirmDialogCloseAt = 0
    const internalSelectedId = ref<string | undefined>(props.selectedId)

    const activeSelectedId = computed({
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
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        card?.scrollIntoView({block: "nearest", behavior: reduceMotion ? "auto" : "smooth"})
    })

    interface EditingBlock {
        id: string
        section: BlockSection
        data: Record<string, unknown>
        path?: string
        docOpen?: boolean
        inputsCollapsed?: boolean
        outputCollapsed?: boolean
    }

    const dockTabs = ref<EditingBlock[]>([])
    const activeTab = computed(() => dockTabs.value.find(tab => tab.id === activeSelectedId.value))

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
            dockTabs.value = [...dockTabs.value, {
                ...tab,
                docOpen: tab.docOpen ?? false,
                inputsCollapsed: tab.inputsCollapsed ?? false,
                outputCollapsed: tab.outputCollapsed ?? false,
            }]
        }
        activeSelectedId.value = tab.id
        touchActivation(tab.id)
    }

    function activateTab(id: string) {
        activeSelectedId.value = id
        touchActivation(id)
    }

    function focusPane(id: string) {
        if (activeSelectedId.value !== id) activateTab(id)
    }

    watch(() => activeTab.value?.data?.type, (type) => {
        if (type) pluginsStore.load?.({cls: String(type)})
    })

    function closeTab(id: string) {
        if (!dockTabs.value.some(tab => tab.id === id)) return
        dockTabs.value = dockTabs.value.filter(tab => tab.id !== id)
        activationOrder.value = activationOrder.value.filter(other => other !== id)
        if (activeSelectedId.value === id) {
            activeSelectedId.value = activationOrder.value[0]
        }
    }

    function closeAllTabs() {
        dockTabs.value = []
        activationOrder.value = []
        activeSelectedId.value = undefined
    }

    function activeDockPaneEl(): HTMLElement | undefined {
        const id = activeSelectedId.value
        if (!id) return undefined
        return document.querySelector<HTMLElement>(`[data-dock-pane-id="${CSS.escape(id)}"]`) ?? undefined
    }

    function focusActiveDockPane(): boolean {
        const pane = activeDockPaneEl()
        if (!pane) return false
        // querySelector on a comma-separated list returns the first DOM-order match
        // across ALL of them, not the first-listed selector's match — so a toolbar
        // button ahead of the form in the DOM would win over an actual field. Query
        // editable fields first and only fall back to generic focusables (buttons,
        // tabindex) when the pane has none, so Tab lands somewhere worth editing.
        const field = pane.querySelector<HTMLElement>(
            "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable=\"true\"]",
        )
        const focusable = field ?? pane.querySelector<HTMLElement>("button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")
        if (!focusable) return false
        focusable.focus()
        return true
    }

    function isFocusInsideDock(): boolean {
        const active = document.activeElement
        const dock = active?.closest<HTMLElement>(".block-editor-dock")
        return Boolean(dock)
    }

    type DockPane = "inputs" | "form" | "output"
    const DOCK_PANE_ORDER: DockPane[] = ["inputs", "form", "output"]
    const DOCK_PANE_SELECTOR: Record<DockPane, string> = {
        inputs: ".task-edit-col-inputs",
        form: ".task-edit-col-params",
        output: ".task-edit-col-output",
    }

    function dockPaneColumnEl(pane: DockPane): HTMLElement | undefined {
        return activeDockPaneEl()?.querySelector<HTMLElement>(DOCK_PANE_SELECTOR[pane]) ?? undefined
    }

    function dockPaneFocusableFields(pane: DockPane): HTMLElement[] {
        const col = dockPaneColumnEl(pane)
        if (!col) return []
        return [...col.querySelectorAll<HTMLElement>(
            "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable=\"true\"], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])",
        )].filter(el =>
            el.offsetParent !== null
            // Tab headers are roving-tabindex controls that consume arrow keys
            // themselves (ElTabs switches the active tab on ArrowUp/Down) —
            // stopping on one makes the next arrow press both switch to the
            // Source tab AND drop focus into its raw-YAML editor.
            && !el.closest("[role=\"tablist\"], .kel-tabs__nav"),
        )
    }

    // Which of the three TaskEdit columns currently owns real DOM focus — undefined
    // when focus is inside the dock but on chrome that isn't one of the three panes
    // (e.g. the tabstrip's close button), or not inside the dock at all.
    function currentDockPane(): DockPane | undefined {
        const active = document.activeElement
        if (!active) return undefined
        return DOCK_PANE_ORDER.find(pane => active.closest(DOCK_PANE_SELECTOR[pane]))
    }

    function focusFirstFieldOfPane(pane: DockPane): boolean {
        const target = dockPaneFocusableFields(pane)[0] ?? dockPaneColumnEl(pane)
        if (!target) return false
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
        target.focus()
        return true
    }

    // ArrowRight/ArrowLeft cycle Inputs -> Form -> Output when a dock tab is open —
    // entry requires canvas focus to already be on the block that's open (so a
    // canvas-only ArrowRight elsewhere keeps doing its normal step-into). Reaching
    // past either end blurs back out to canvas-level (dock stays open).
    function advanceDockPane(direction: 1 | -1): boolean {
        if (!dockTabs.value.length) return false
        const current = currentDockPane()
        if (!current) {
            if (direction < 0 || !focusedId.value || focusedId.value !== activeSelectedId.value) return false
            return focusFirstFieldOfPane(DOCK_PANE_ORDER[0])
        }
        const nextIndex = DOCK_PANE_ORDER.indexOf(current) + direction
        if (nextIndex < 0) {
            // Exiting the dock leftward returns real focus to the canvas card,
            // so a follow-up Tab or arrow continues from there.
            if (focusedId.value) {
                focusCanvasCard(focusedId.value)
            } else {
                (document.activeElement as HTMLElement | null)?.blur()
            }
            return true
        }
        if (nextIndex >= DOCK_PANE_ORDER.length) return true
        return focusFirstFieldOfPane(DOCK_PANE_ORDER[nextIndex])
    }

    // ArrowUp/ArrowDown move real focus between a pane's own fields once inside the
    // dock — absorbed even when nothing resolves, so canvas j/k never fires by
    // accident while the user is navigating a form.
    function moveDockPaneFocus(direction: 1 | -1) {
        const pane = currentDockPane()
        if (!pane) return
        const fields = dockPaneFocusableFields(pane)
        if (!fields.length) return
        const index = fields.indexOf(document.activeElement as HTMLElement)
        const nextIndex = index === -1 ? 0 : index + direction
        if (nextIndex < 0 || nextIndex >= fields.length) return
        fields[nextIndex].focus()
    }

    const route = useRoute()
    const router = useRouter()
    const DOCK_SECTIONS: BlockSection[] = ["tasks", "triggers", "errors", "finally"]
    let restoringDock = false

    const dockStateKey = computed(() => [
        dockTabs.value.map(tab => `${tab.section}:${tab.id}`).join(","),
        activeSelectedId.value ?? "",
        splitCount.value,
        activeTab.value?.inputsCollapsed ?? false,
        activeTab.value?.outputCollapsed ?? false,
        activeTab.value?.docOpen ?? false,
    ].join("|"))

    // Debounced: dockStateKey can change several times in a single burst (opening
    // a tab, then immediately toggling collapse, etc.), and each change used to
    // fire its own router.replace() — a rapid string of navigations racing each
    // other. Coalescing to the LAST state in the burst keeps the URL in sync with
    // one navigation instead of N.
    let dockUrlSyncTimer: ReturnType<typeof setTimeout> | undefined
    watch(dockStateKey, () => {
        if (restoringDock) return
        clearTimeout(dockUrlSyncTimer)
        dockUrlSyncTimer = setTimeout(() => {
            const query: LocationQueryRaw = {...route.query}
            const tabs = dockTabs.value.map(tab => `${tab.section}:${tab.id}`).join(",")
            if (tabs) query.tabs = tabs
            else delete query.tabs
            if (activeSelectedId.value) query.tab = activeSelectedId.value
            else delete query.tab
            if (tabs && splitCount.value > 1) query.cols = String(splitCount.value)
            else delete query.cols
            const active = activeTab.value
            const collapsed = [
                active?.inputsCollapsed ? "inputs" : "",
                active?.outputCollapsed ? "output" : "",
            ].filter(Boolean).join(",")
            if (tabs && collapsed) query.collapsed = collapsed
            else delete query.collapsed
            if (tabs && active?.docOpen) query.doc = "1"
            else delete query.doc
            router.replace({query}).catch(() => {})
        }, 300)
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
            if (block) {
                openTab({id, section, data: block})
            } else {
                const nestedPath = findNestedPath(sectionList(section), id, section)
                if (nestedPath) openNestedEdit(nestedPath)
            }
        }
        const active = route.query.tab
        if (typeof active === "string" && dockTabs.value.some(tab => tab.id === active)) {
            activateTab(active)
        }
        const cols = Number(route.query.cols)
        if (cols >= 1 && cols <= 3) splitCount.value = cols
        const collapsed = typeof route.query.collapsed === "string" ? route.query.collapsed.split(",") : []
        const activeTabObj = dockTabs.value.find(tab => tab.id === activeSelectedId.value)
        if (activeTabObj) {
            activeTabObj.inputsCollapsed = collapsed.includes("inputs")
            activeTabObj.outputCollapsed = collapsed.includes("output")
            activeTabObj.docOpen = route.query.doc === "1"
        }
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

    const undoState = ref<{label: string} | null>(null)
    let undoSnapshot: string | null = null
    let undoTimer: ReturnType<typeof setTimeout> | undefined

    function deleteWithUndo(name: string, mutate: () => void) {
        const snapshot = flowYaml.value
        mutate()
        undoSnapshot = snapshot
        undoState.value = {label: t("block_editor.block_deleted", {name})}
        clearTimeout(undoTimer)
        undoTimer = setTimeout(dismissUndo, 6000)
    }

    function performUndo() {
        if (undoSnapshot != null) applyYaml(undoSnapshot)
        dismissUndo()
    }

    function dismissUndo() {
        undoState.value = null
        undoSnapshot = null
        clearTimeout(undoTimer)
    }

    function onDelete(section: BlockSection, id: unknown) {
        if (typeof id !== "string") return
        deleteWithUndo(id, () => {
            const newYaml = deleteBlock(flowYaml.value, section, id)
            closeTab(id)
            applyYaml(newYaml)
        })
    }

    function onDeleteAtPath(path: string) {
        const blockYaml = flowYamlUtils.extractBlockWithPath({source: flowYaml.value, path})
        const parsed = blockYaml ? flowYamlUtils.parse<Record<string, unknown>>(blockYaml) : null
        const name = parsed?.id ? String(parsed.id) : path
        deleteWithUndo(name, () => {
            const newYaml = deleteBlockAtPath(flowYaml.value, path)
            if (parsed?.id) closeTab(String(parsed.id))
            applyYaml(newYaml)
        })
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
    const pickerSearchInput = ref<InstanceType<typeof KsInput>>()
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
    const taskPickerPosition = ref<"before" | "after">("after")
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
    const SUGGESTED_FQCNS_BY_SECTION: Record<BlockSection, string[]> = {
        tasks: [
            "io.kestra.plugin.core.log.Log",
            "io.kestra.plugin.core.http.Request",
            "io.kestra.plugin.scripts.python.Script",
            "io.kestra.plugin.scripts.shell.Commands",
            "io.kestra.plugin.core.flow.Subflow",
            "io.kestra.plugin.core.flow.If",
            "io.kestra.plugin.core.flow.Switch",
            "io.kestra.plugin.core.flow.Loop",
            "io.kestra.plugin.core.flow.Parallel",
            "io.kestra.plugin.core.flow.Dag",
        ],
        triggers: [
            "io.kestra.plugin.core.trigger.Schedule",
            "io.kestra.plugin.core.trigger.Webhook",
            "io.kestra.plugin.core.trigger.Flow",
        ],
        errors: [
            "io.kestra.plugin.core.log.Log",
            "io.kestra.plugin.core.execution.Fail",
            "io.kestra.plugin.core.http.Request",
        ],
        finally: [
            "io.kestra.plugin.core.log.Log",
            "io.kestra.plugin.core.storage.PurgeCurrentExecutionFiles",
            "io.kestra.plugin.core.http.Request",
        ],
    }

    function anchorFrom(evt?: Event) {
        // Keyboard-triggered opens (no evt) have no click target to anchor to. Falling
        // back to editorEl (the whole scrollable panel) pins the picker near the top of
        // the panel's layout box regardless of scroll position, which renders it
        // off-screen for any focused block that isn't near the top. Anchor to the
        // focused card instead so the picker opens next to the actual insertion point.
        pickerAnchor.value = (evt?.currentTarget as HTMLElement) ?? focusedCard() ?? editorEl.value ?? undefined
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

    function focusPickerSearch() {
        nextTick(() => pickerSearchInput.value?.focus())
    }

    function openTaskPicker(section: BlockSection, evt?: Event) {
        anchorFrom(evt)
        taskPickerSection.value = section
        taskPickerParentPath.value = undefined
        taskPickerAfterIndex.value = undefined
        taskPickerPosition.value = "after"
        resetPickerView()
        taskPickerVisible.value = true
        ensurePluginData()
        focusPickerSearch()
    }

    function sectionFromParentPath(parentPath: string): BlockSection {
        const lane = parentPath.split(".").pop() ?? ""
        if (lane === "errors") return "errors"
        if (lane === "finally") return "finally"
        return "tasks"
    }

    function openTaskPickerAtPath(
        parentPath: string,
        refIndex: number,
        evt?: Event,
        position: "before" | "after" = "after",
    ) {
        anchorFrom(evt)
        taskPickerSection.value = sectionFromParentPath(parentPath)
        taskPickerParentPath.value = parentPath
        taskPickerAfterIndex.value = refIndex >= 0 ? refIndex : undefined
        taskPickerPosition.value = position
        resetPickerView()
        taskPickerVisible.value = true
        ensurePluginData()
        focusPickerSearch()
    }

    function focusedBlockPath(): string | undefined {
        const id = focusedId.value
        if (!id) return undefined
        for (const section of DOCK_SECTIONS) {
            const found = findNestedPath(sectionList(section), id, section)
            if (found) return found
        }
        return undefined
    }

    function openTaskPickerAnchoredAfterFocused() {
        const sentinelSection = sectionFromSentinel(focusedId.value)
        if (sentinelSection) {
            openTaskPicker(sentinelSection)
            return
        }
        const laneParentPath = parentPathFromLaneSentinel(focusedId.value)
        if (laneParentPath) {
            openTaskPickerAtPath(laneParentPath, -1)
            return
        }
        const path = focusedBlockPath()
        if (!path) {
            openTaskPicker("tasks")
            return
        }
        const match = path.match(/^(.*)\[(\d+)\]$/)
        if (!match) {
            openTaskPicker("tasks")
            return
        }
        openTaskPickerAtPath(match[1], parseInt(match[2], 10))
    }

    function openTaskPickerAnchoredBeforeFocused() {
        const sentinelSection = sectionFromSentinel(focusedId.value)
        if (sentinelSection) {
            openTaskPicker(sentinelSection)
            return
        }
        const laneParentPath = parentPathFromLaneSentinel(focusedId.value)
        if (laneParentPath) {
            openTaskPickerAtPath(laneParentPath, -1)
            return
        }
        const path = focusedBlockPath()
        if (!path) {
            openTaskPicker("tasks")
            return
        }
        const match = path.match(/^(.*)\[(\d+)\]$/)
        if (!match) {
            openTaskPicker("tasks")
            return
        }
        // Anchor on the focused block's own index with position "before" — an
        // undefined ref (what index - 1 would produce for the first item) resolves
        // to "the last item" in insertBlockWithPath, not "the first", so a real
        // ref + explicit "before" is required to land ahead of index 0.
        openTaskPickerAtPath(match[1], parseInt(match[2], 10), undefined, "before")
    }

    const pickerStyle = computed(() => {
        const anchor = pickerAnchor.value
        if (!anchor) return {}
        const rect = anchor.getBoundingClientRect()
        const width = 440
        const gap = 4
        const margin = 8
        const maxHeight = 420
        const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin))
        const spaceBelow = window.innerHeight - rect.bottom - gap - margin
        const spaceAbove = rect.top - gap - margin
        const openUp = spaceBelow < Math.min(maxHeight, 280) && spaceAbove > spaceBelow
        const available = Math.max(200, Math.min(maxHeight, openUp ? spaceAbove : spaceBelow))
        return {
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${available}px`,
            ...(openUp
                ? {bottom: `${window.innerHeight - rect.top + gap}px`}
                : {top: `${rect.bottom + gap}px`}),
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

    const activeEntryKind = computed(() => taskPickerSection.value === "triggers" ? "triggers" : "tasks")

    const allPickerEntries = computed<PickerEntry[]>(() => {
        if (!pluginsStore.plugins) return []
        const entries: PickerEntry[] = []
        const seen = new Set<string>()
        const kind = activeEntryKind.value
        for (const plugin of pluginsStore.plugins) {
            const value = plugin[kind]
            if (!isEntryAPluginElementPredicate(kind, value)) continue
            for (const el of value as PluginElement[]) {
                if (el.deprecated || seen.has(el.cls)) continue
                seen.add(el.cls)
                const parts = el.cls.split(".")
                entries.push({
                    fqcn: el.cls,
                    name: parts[parts.length - 1] ?? el.cls,
                    label: el.title ?? parts[parts.length - 1] ?? el.cls,
                    group: plugin.title ?? plugin.name ?? "",
                })
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
        SUGGESTED_FQCNS_BY_SECTION[taskPickerSection.value]
            .map(fqcn => entryByFqcn.value.get(fqcn))
            .filter((e): e is PickerEntry => Boolean(e)),
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

    const sectionLabel = computed(() => sectionDisplayLabel(taskPickerSection.value))

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
            applyYaml(addBlockAtPath(flowYaml.value, taskPickerParentPath.value, block, taskPickerAfterIndex.value, taskPickerPosition.value))
        } else {
            const section = taskPickerSection.value
            const list = sectionList(section)
            const lastId = list.length > 0
                ? String(list[list.length - 1].id ?? "")
                : undefined
            applyYaml(addBlock(flowYaml.value, section, block, lastId))
        }
        // Move focus onto the block that was just created so the keyboard flow
        // continues naturally (edit it, reorder it, insert after it again)
        // instead of leaving the ring on whatever was focused before insertion.
        focusCanvasCard(String(block.id))
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

    function focusedCard(): HTMLElement | undefined {
        return navigableCards().find(el => el.getAttribute("data-block-id") === focusedId.value)
    }

    // The element that actually holds the card's roving tabindex — the card
    // root for leaf cards and sentinels, the header for flowable clusters.
    function cardFocusTarget(card: HTMLElement): HTMLElement {
        if (card.hasAttribute("tabindex") || card.tagName === "BUTTON") return card
        return card.querySelector<HTMLElement>("[data-test='flowable-cluster-header']") ?? card
    }

    // Single entry point for moving the canvas focus: keeps the virtual ring
    // (focusedId) and the REAL DOM focus in lockstep, so native Tab always
    // continues from wherever arrow-key navigation left off — one focus model,
    // not two (roving tabindex).
    function focusCanvasCard(id: string | undefined) {
        focusedId.value = id
        if (!id) return
        nextTick(() => {
            const card = focusedCard()
            if (!card) return
            cardFocusTarget(card).focus({preventScroll: true})
            card.scrollIntoView({block: "nearest"})
        })
    }

    // The reverse sync: Tab or a click landing anywhere inside a canvas card
    // moves the ring there, so shortcuts (a, d, Enter…) act on what the user
    // actually reached, not on a stale virtual position.
    function onCanvasFocusIn(event: FocusEvent) {
        const target = event.target as HTMLElement | null
        if (!target || target.closest(".block-editor-dock")) return
        const id = target.closest("[data-block-id]")?.getAttribute("data-block-id")
        if (id) focusedId.value = id
    }

    // Tab entry point while nothing is focused yet: the canvas container is
    // the composite's single Tab stop and delegates to its first card.
    function onCanvasEntryFocus() {
        const first = navigableCards()[0]
        if (first) focusCanvasCard(first.getAttribute("data-block-id") ?? undefined)
    }

    function moveFocus(direction: 1 | -1) {
        const cards = navigableCards()
        if (!cards.length) return
        const ids = cards.map(el => el.getAttribute("data-block-id") ?? "")
        const current = focusedId.value ? ids.indexOf(focusedId.value) : -1
        const next = current < 0 ? (direction > 0 ? 0 : cards.length - 1) : (current + direction + cards.length) % cards.length
        focusCanvasCard(ids[next] || undefined)
    }

    function focusedClusterHeader(): HTMLElement | undefined {
        const card = focusedCard()
        if (!card) return undefined
        return card.matches("[data-test='flowable-cluster-header']")
            ? card
            : (card.querySelector<HTMLElement>("[data-test='flowable-cluster-header']") ?? undefined)
    }

    function stepInto() {
        const header = focusedClusterHeader()
        if (!header) return
        if (header.getAttribute("aria-expanded") === "false") {
            header.click()
            return
        }
        nextTick(() => {
            const card = focusedCard()
            const cards = navigableCards()
            const current = focusedId.value ? cards.findIndex(el => el.getAttribute("data-block-id") === focusedId.value) : -1
            const next = cards[current + 1]
            if (card && next && current >= 0 && card.contains(next)) {
                focusCanvasCard(next.getAttribute("data-block-id") ?? focusedId.value)
            }
        })
    }

    function stepOut() {
        const header = focusedClusterHeader()
        if (header?.getAttribute("aria-expanded") === "true") {
            header.click()
            return
        }
        const card = focusedCard()
        const parent = card?.parentElement?.closest<HTMLElement>("[data-block-id]")
        if (parent) {
            focusCanvasCard(parent.getAttribute("data-block-id") ?? focusedId.value)
        }
    }

    function openFocused() {
        const card = focusedCard()
        if (!card) return
        const clusterHeader = card.querySelector<HTMLElement>("[data-test='flowable-cluster-header']")
        if (clusterHeader) {
            clusterHeader.click()
        } else {
            card.click()
        }
    }

    function actionInFocused(selector: string) {
        focusedCard()?.querySelector<HTMLElement>(selector)?.click()
    }

    function focusedBlockDisplayName(): string {
        const card = focusedCard()
        return card?.querySelector<HTMLElement>("[data-test='block-card-id']")?.textContent?.trim() || focusedId.value || ""
    }

    function focusedBlockIsFlowable(): boolean {
        return Boolean(focusedCard()?.querySelector("[data-test='flowable-cluster-header']"))
    }

    function confirmDelete(name: string, isFlowableBlock: boolean, onConfirm: () => void) {
        const message = isFlowableBlock
            ? t("block_editor.confirm_delete.message_group", {name})
            : t("block_editor.confirm_delete.message", {name})
        confirmDialogOpen.value = true
        KsMessageBox.confirm(message, t("block_editor.confirm_delete.title", {name}), {
            type: "warning",
            confirmButtonText: t("block_editor.delete"),
            cancelButtonText: t("cancel"),
        }).then(onConfirm).catch(() => {}).finally(() => {
            confirmDialogOpen.value = false
            // KsMessageBox resolves/rejects its promise through several microtask
            // checkpoints that browsers run between bubble-phase DOM listeners, so by
            // the time the Escape that dismissed it reaches our window-level listener
            // (the outermost, and therefore last, bubble target) confirmDialogOpen has
            // already flipped back to false. A short grace window is the only reliable
            // way to recognize "this Escape just closed the confirm dialog" from here.
            lastConfirmDialogCloseAt = performance.now()
        })
    }

    function requestDeleteFocused() {
        if (!focusedId.value) return
        // Sentinels (empty sections/lanes) aren't real blocks — there is nothing
        // to delete, and the confirm dialog would leak the internal __section:/
        // __lane: id as the block "name".
        if (sectionFromSentinel(focusedId.value) || parentPathFromLaneSentinel(focusedId.value)) return
        const name = focusedBlockDisplayName()
        const isFlowableBlock = focusedBlockIsFlowable()
        confirmDelete(name, isFlowableBlock, () => {
            // Hand focus to a neighbor before the card disappears, so keyboard
            // navigation continues from the deletion point instead of resetting
            // to the top of the canvas. A flowable's children sit between it and
            // its true next sibling in DOM order and disappear with it — skip
            // anything the deleted card contains.
            const cards = navigableCards()
            const current = cards.find(el => el.getAttribute("data-block-id") === focusedId.value)
            const index = current ? cards.indexOf(current) : -1
            const neighbor = cards.slice(index + 1).find(el => !current?.contains(el)) ?? cards[index - 1]
            actionInFocused("[data-test='block-card-delete']")
            focusCanvasCard(neighbor?.getAttribute("data-block-id") ?? undefined)
        })
    }

    function addAfterFocused() {
        openTaskPickerAnchoredAfterFocused()
    }

    function addBeforeFocused() {
        openTaskPickerAnchoredBeforeFocused()
    }

    function isAnyOverlayOpen(): boolean {
        return shortcutsOpen.value || taskPickerVisible.value || commandMenuOpen.value || confirmDialogOpen.value
    }

    function closeTopOverlay(): boolean {
        if (commandMenuOpen.value) {
            commandMenuOpen.value = false
            return true
        }
        if (shortcutsOpen.value) {
            shortcutsOpen.value = false
            return true
        }
        if (taskPickerVisible.value) {
            taskPickerVisible.value = false
            return true
        }
        return false
    }

    // TODO: wire to a real flow-level undo/redo history once the flow store exposes one;
    // for now Cmd/Ctrl+Z only replays the block-deletion undo snapshot.
    function performUndoIfAvailable() {
        if (undoState.value) performUndo()
    }

    function dispatchBlockEditorAction(id: string, event: KeyboardEvent) {
        // "save" is intentionally a no-op here: NoCode.vue's useKeyboardSave()
        // already owns the global Cmd/Ctrl+S handler. It stays in the keymap
        // only so the help overlay and footer hints can show it.
        if (id === "undo") {
            performUndoIfAvailable()
            return
        }
        if (id === "command-menu") {
            commandMenuOpen.value = true
            return
        }
        if (id === "focus-panel") {
            // Native Tab must keep working untouched both when there is no dock
            // to jump into AND when focus is already inside it (tabbing between
            // the dock's own fields) — the shortcut is only a convenience jump
            // from outside the panel.
            if (isFocusInsideDock()) return false
            return focusActiveDockPane()
        }
        if (id === "clear") {
            if (closeTopOverlay()) return
            // KsMessageBox owns its own Escape-to-cancel and isn't tracked by
            // closeTopOverlay(). Its promise settles through microtask checkpoints
            // that run between bubble-phase listeners, so confirmDialogOpen has
            // already flipped back to false by the time this (window-level, outermost)
            // handler sees the same Escape — hence the timestamp grace window instead
            // of a reactive-state check.
            if (confirmDialogOpen.value || performance.now() - lastConfirmDialogCloseAt < 100) return
            // Escape backs out one level at a time: out of an editing field back
            // onto the canvas card first (panel stays open), then a second
            // Escape closes the panel. Returning real focus to the card keeps a
            // follow-up Tab continuing from there instead of from nowhere.
            if (dockTabs.value.length > 0 && isFocusInsideDock()) {
                if (focusedId.value) {
                    focusCanvasCard(focusedId.value)
                } else {
                    (document.activeElement as HTMLElement | null)?.blur()
                }
                return
            }
            if (dockTabs.value.length > 0) {
                closeAllTabs()
                return
            }
            if (focusedId.value) {
                const card = focusedCard()
                if (card && card.contains(document.activeElement)) {
                    (document.activeElement as HTMLElement | null)?.blur()
                }
            }
            focusedId.value = undefined
            return
        }
        if (id === "help") {
            shortcutsOpen.value = !shortcutsOpen.value
            return
        }
        if (isAnyOverlayOpen()) return

        if (id === "quick-insert") {
            // Anchor on whatever is already canvas-focused, same as "a" — otherwise this
            // always opens the Tasks-section picker regardless of scroll position, which
            // looks like it opened "at the top of the screen" when focus is further down.
            if (focusedId.value) {
                addAfterFocused()
            } else {
                openTaskPicker("tasks")
            }
        } else if (id === "move") {
            if (isFocusInsideDock()) {
                moveDockPaneFocus(event.key === "ArrowDown" ? 1 : -1)
            } else {
                moveFocus(event.key === "ArrowDown" || event.key === "j" ? 1 : -1)
            }
        } else if (id === "step-into") {
            if (!advanceDockPane(1)) stepInto()
        } else if (id === "step-out") {
            if (!advanceDockPane(-1)) stepOut()
        } else if (id === "reorder") {
            const direction = event.key === "ArrowDown" ? "down" : "up"
            if (focusedId.value) {
                moveFocused(direction)
            } else if (activeSelectedId.value) {
                moveSelected(direction)
            }
        } else if (id === "open") {
            // With roving focus, Enter/Space can land on a native interactive
            // element that isn't a canvas card (a section's Add button, a link…)
            // — let the browser activate it instead of opening the stale ring.
            const target = event.target as HTMLElement | null
            if (target?.closest("button, a, [role='button']") && !target.closest("[data-block-id]")) return false
            if (focusedId.value) openFocused()
        } else if (id === "duplicate") {
            if (focusedId.value) {
                actionInFocused("[data-test='block-card-duplicate']")
            } else if (activeSelectedId.value) {
                duplicateSelected()
            }
        } else if (id === "delete") {
            if (focusedId.value) {
                requestDeleteFocused()
            } else if (activeSelectedId.value) {
                requestDeleteSelected()
            }
        } else if (id === "insert-after") {
            addAfterFocused()
        } else if (id === "insert-before") {
            addBeforeFocused()
        }
    }

    useBlockEditorKeyboard({
        keymap: BLOCK_EDITOR_KEYMAP,
        dispatch: dispatchBlockEditorAction,
        isOverlayOpen: isAnyOverlayOpen,
    })

    function deleteSelected() {
        const tab = activeTab.value
        if (!activeSelectedId.value || !tab) return
        if (tab.path) {
            onDeleteAtPath(tab.path)
        } else {
            onDelete(tab.section, tab.id)
        }
    }

    function requestDeleteSelected() {
        const tab = activeTab.value
        if (!activeSelectedId.value || !tab) return
        const isFlowableBlock = isFlowable(tab.data)
        confirmDelete(tab.id, isFlowableBlock, () => deleteSelected())
    }

    function duplicateSelected() {
        const tab = activeTab.value
        if (!activeSelectedId.value || !tab) return
        if (tab.path) {
            onDuplicateAtPath(tab.path)
        } else {
            onDuplicate(tab.section, tab.id)
        }
    }

    function moveFocused(direction: "up" | "down") {
        const path = focusedBlockPath()
        if (!path) return
        const newYaml = moveBlockAtPath(flowYaml.value, path, direction)
        if (newYaml === flowYaml.value) return
        applyYaml(newYaml)
        // focusedId tracks the block by id, not by position, so the ring already
        // follows it after the reorder — just keep it scrolled into view.
        nextTick(() => focusedCard()?.scrollIntoView({block: "nearest"}))
    }

    function moveSelected(direction: "up" | "down") {
        const tab = activeTab.value
        if (!activeSelectedId.value || !tab) return
        const path = tab.path
        if (!path) {
            const section = tab.section
            const list = section === "tasks" ? parsedTasks.value
                : section === "errors" ? flowLevelErrors.value
                    : section === "finally" ? flowLevelFinally.value
                        : parsedTriggers.value
            const idx = list.findIndex(item => String(item.id) === activeSelectedId.value)
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

    const KEY_DISPLAY: Record<string, string> = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        Enter: "↵",
        Backspace: "⌫",
        Delete: "⌦",
        "Meta+Shift+p": "⌘⇧P",
        "Control+Shift+p": "⌘⇧P",
        "Meta+s": "⌘S",
        "Control+s": "⌘S",
        "Meta+z": "⌘Z",
        "Control+z": "⌘Z",
        "Alt+ArrowUp": "⌥↑",
        "Alt+ArrowDown": "⌥↓",
    }

    function displayKeys(keys: string[]): string[] {
        const seen = new Set<string>()
        const result: string[] = []
        for (const key of keys) {
            const display = KEY_DISPLAY[key] ?? key
            if (seen.has(display)) continue
            seen.add(display)
            result.push(display)
        }
        return result
    }

    const SHORTCUT_GROUP_ORDER: BlockEditorKeymapGroup[] = ["navigate", "insert", "edit", "global"]

    const shortcutGroups = computed(() =>
        SHORTCUT_GROUP_ORDER.map(group => ({group, bindings: blockEditorKeymapByGroup(group)})),
    )

    const footerContext = computed(() => {
        if (commandMenuOpen.value) return t("block_editor.footer.command_menu")
        if (taskPickerVisible.value) return t("block_editor.footer.inserting")
        if (dockTabs.value.length) return t("block_editor.footer.editing")
        const sentinelSection = sectionFromSentinel(focusedId.value)
        if (sentinelSection) return t("block_editor.footer.selected", {name: sectionDisplayLabel(sentinelSection)})
        const laneParentPath = parentPathFromLaneSentinel(focusedId.value)
        if (laneParentPath) return t("block_editor.footer.selected", {name: laneDisplayLabelFromPath(laneParentPath)})
        if (focusedId.value) return t("block_editor.footer.selected", {name: focusedBlockDisplayName()})
        return t("block_editor.footer.canvas")
    })

    interface FooterHint {
        id: string
        keys: string[]
        i18nKey: string
    }

    // Keys for canvas-rebindable actions are looked up from BLOCK_EDITOR_KEYMAP (the
    // single source of truth) instead of being duplicated here, so the footer can never
    // drift from the actual dispatch table. Enter/Escape are left literal where they
    // describe generic modal-navigation UX (confirm/close a list) rather than a specific
    // rebindable canvas action.
    function keysFor(id: string): string[] {
        return findBlockEditorBinding(id)?.keys ?? []
    }

    const footerHints = computed<FooterHint[]>(() => {
        if (taskPickerVisible.value || commandMenuOpen.value) {
            return [
                {id: "move", keys: ["ArrowUp", "ArrowDown"], i18nKey: "block_editor.kbd_navigate"},
                {id: "run", keys: ["Enter"], i18nKey: "block_editor.kbd_add"},
                {id: "close", keys: ["Escape"], i18nKey: "block_editor.kbd_close"},
            ]
        }
        if (dockTabs.value.length) {
            return [
                {id: "close", keys: ["Escape"], i18nKey: "block_editor.footer.close_panel"},
                {id: "move", keys: keysFor("move"), i18nKey: "block_editor.shortcuts.move_between"},
                {id: "step-into", keys: keysFor("step-into"), i18nKey: "block_editor.shortcuts.step_into"},
                {id: "step-out", keys: keysFor("step-out"), i18nKey: "block_editor.shortcuts.step_out"},
                {id: "insert", keys: keysFor("insert-after"), i18nKey: "block_editor.shortcuts.add_after"},
            ]
        }
        // A real block (not an empty section's sentinel) additionally supports
        // inserting before it and reordering it — surface those here too, since
        // they were previously only discoverable through the "?" help overlay.
        const isRealBlockFocused = Boolean(focusedId.value)
            && !sectionFromSentinel(focusedId.value)
            && !parentPathFromLaneSentinel(focusedId.value)
        return [
            {id: "move", keys: keysFor("move"), i18nKey: "block_editor.shortcuts.move_between"},
            {id: "open", keys: keysFor("open"), i18nKey: "block_editor.shortcuts.open"},
            {id: "insert", keys: keysFor("insert-after"), i18nKey: "block_editor.shortcuts.add_after"},
            ...(isRealBlockFocused
                ? [
                    {id: "insert-before", keys: keysFor("insert-before"), i18nKey: "block_editor.shortcuts.add_before"},
                    {id: "reorder", keys: keysFor("reorder"), i18nKey: "block_editor.shortcuts.reorder"},
                ]
                : []),
            {id: "command-menu", keys: keysFor("command-menu"), i18nKey: "block_editor.shortcuts.command_palette"},
            {id: "help", keys: keysFor("help"), i18nKey: "block_editor.shortcuts.toggle"},
        ]
    })

    const commandMenuContextLabel = computed(() => {
        const sentinelSection = sectionFromSentinel(focusedId.value)
        if (sentinelSection) return t("block_editor.command_menu.context_selected", {name: sectionDisplayLabel(sentinelSection)})
        const laneParentPath = parentPathFromLaneSentinel(focusedId.value)
        if (laneParentPath) return t("block_editor.command_menu.context_selected", {name: laneDisplayLabelFromPath(laneParentPath)})
        return focusedId.value
            ? t("block_editor.command_menu.context_selected", {name: focusedBlockDisplayName()})
            : t("block_editor.command_menu.context_flow")
    })

    const commandMenuItems = computed<BlockCommandMenuItem[]>(() => {
        const items: BlockCommandMenuItem[] = []
        const focusedSentinelSection = sectionFromSentinel(focusedId.value)
        const focusedLaneSentinel = parentPathFromLaneSentinel(focusedId.value)
        const insertLabel = focusedSentinelSection
            ? t("block_editor.command_menu.insert_in_section", {section: sectionDisplayLabel(focusedSentinelSection)})
            : focusedLaneSentinel
                ? t("block_editor.command_menu.insert_in_section", {section: laneDisplayLabelFromPath(focusedLaneSentinel)})
                : focusedId.value
                    ? t("block_editor.command_menu.insert_after", {name: focusedBlockDisplayName()})
                    : t("block_editor.command_menu.insert_at_end")
        items.push({
            id: "insert",
            group: t("block_editor.command_menu.group_insert"),
            title: insertLabel,
            icon: PlusCircleOutline,
            shortcut: "A",
            run: () => {
                commandMenuOpen.value = false
                addAfterFocused()
            },
        })

        if (focusedId.value && !focusedSentinelSection && !focusedLaneSentinel) {
            items.push({
                id: "insert-before",
                group: t("block_editor.command_menu.group_insert"),
                title: t("block_editor.command_menu.insert_before", {name: focusedBlockDisplayName()}),
                icon: PlusCircleOutline,
                shortcut: "⇧A",
                run: () => {
                    commandMenuOpen.value = false
                    addBeforeFocused()
                },
            })
        }

        if (focusedId.value && !focusedSentinelSection && !focusedLaneSentinel) {
            const name = focusedBlockDisplayName()
            items.push({
                id: "open",
                group: t("block_editor.command_menu.group_block"),
                title: t("block_editor.command_menu.open", {name}),
                icon: OpenInNew,
                shortcut: "↵",
                run: () => {
                    commandMenuOpen.value = false
                    openFocused()
                },
            })
            items.push({
                id: "duplicate",
                group: t("block_editor.command_menu.group_block"),
                title: t("block_editor.command_menu.duplicate", {name}),
                icon: ContentCopy,
                shortcut: "D",
                run: () => {
                    commandMenuOpen.value = false
                    actionInFocused("[data-test='block-card-duplicate']")
                },
            })
            items.push({
                id: "delete",
                group: t("block_editor.command_menu.group_block"),
                title: t("block_editor.command_menu.delete", {name}),
                icon: DeleteOutline,
                shortcut: "⌫",
                run: () => {
                    commandMenuOpen.value = false
                    requestDeleteFocused()
                },
            })
        }

        const sections: {section: BlockSection; labelKey: string}[] = [
            {section: "triggers", labelKey: "no_code.sections.triggers"},
            {section: "tasks", labelKey: "no_code.sections.tasks"},
            {section: "errors", labelKey: "block_editor.lane_errors"},
            {section: "finally", labelKey: "block_editor.lane_finally"},
        ]
        for (const {section, labelKey} of sections) {
            items.push({
                id: `goto-${section}`,
                group: t("block_editor.command_menu.group_goto"),
                title: t("block_editor.command_menu.goto", {section: t(labelKey)}),
                icon: ArrowRightBold,
                run: () => {
                    commandMenuOpen.value = false
                    const list = sectionList(section)
                    focusCanvasCard(list.length ? String(list[0].id ?? 0) : sectionSentinelId(section))
                },
            })
        }

        items.push({
            id: "save",
            group: t("block_editor.command_menu.group_flow"),
            title: t("block_editor.command_menu.save"),
            icon: ContentSave,
            shortcut: "⌘S",
            run: () => {
                commandMenuOpen.value = false
                flowStore.save()
            },
        })

        return items
    })
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
        padding: var(--ks-spacing-6) var(--ks-spacing-4) calc(2.25rem + var(--ks-spacing-6));
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

    .block-editor-dock-tab:focus-visible {
        outline: 2px solid var(--ks-border-focus);
        outline-offset: -2px;
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

    .block-editor-dock-split-btn:focus-visible {
        outline: 2px solid var(--ks-border-focus);
        outline-offset: -1px;
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
        flex: 1;
        min-height: 0;
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
        box-sizing: border-box;
        width: 1.5rem;
        height: 1.5rem;
        padding: 2px;
        background: var(--ks-bg-plugin-icon);
        border: 1px solid var(--ks-border-subtle);
        border-radius: var(--ks-radius-sm);
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

    .block-editor-picker-back:focus-visible {
        outline: 2px solid var(--ks-border-focus);
        outline-offset: -2px;
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
        color: var(--ks-text-secondary);
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

    .block-editor-shortcut-or {
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
        padding: 0 1px;
    }

    .block-editor-footer {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9;
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-4);
        height: 2.25rem;
        padding: 0 var(--ks-spacing-4);
        background: var(--ks-bg-surface);
        border-top: 1px solid var(--ks-border-subtle);
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-secondary);
        overflow-x: auto;
    }

    .block-editor-footer-context {
        margin-right: auto;
        flex-shrink: 0;
        color: var(--ks-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-editor-footer-hint {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        flex-shrink: 0;
        white-space: nowrap;
    }

    .block-editor-footer-hint kbd {
        font-family: var(--ks-font-family-mono);
        font-size: var(--ks-font-size-xs);
        background: var(--ks-bg-tag-inactive);
        border: 1px solid var(--ks-border-subtle);
        border-radius: var(--ks-radius-sm);
        padding: 1px var(--ks-spacing-1);
        min-width: 18px;
        text-align: center;
        color: var(--ks-text-secondary);
    }

    .block-editor-help {
        position: absolute;
        right: var(--ks-spacing-4);
        bottom: calc(2.25rem + var(--ks-spacing-3));
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
        color: var(--ks-text-secondary);
    }

    .block-editor-undo {
        position: absolute;
        bottom: calc(2.25rem + var(--ks-spacing-3));
        left: 50%;
        transform: translateX(-50%);
        z-index: 11;
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-3);
        padding: var(--ks-spacing-2) var(--ks-spacing-2) var(--ks-spacing-2) var(--ks-spacing-4);
        background: var(--ks-bg-elevated);
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-lg);
        box-shadow: var(--ks-shadow-sm);
        font-size: var(--ks-font-size-sm);
        color: var(--ks-text-primary);
    }

    .block-editor-undo-label {
        white-space: nowrap;
    }

    .block-editor-undo-btn {
        border: none;
        background: transparent;
        color: var(--ks-text-link);
        font-weight: 600;
        font-size: var(--ks-font-size-sm);
        cursor: pointer;
        padding: var(--ks-spacing-1) var(--ks-spacing-2);
        border-radius: var(--ks-radius-sm);
        transition: background-color 0.12s;
    }

    .block-editor-undo-btn:hover {
        background: var(--ks-bg-hover);
    }

    .block-editor-undo-btn:focus-visible {
        outline: 2px solid var(--ks-border-focus);
        outline-offset: 1px;
    }

    .block-editor-undo-enter-active,
    .block-editor-undo-leave-active {
        transition: opacity 0.18s ease, transform 0.18s ease;
    }

    .block-editor-undo-enter-from,
    .block-editor-undo-leave-to {
        opacity: 0;
        transform: translate(-50%, 8px);
    }

    @media (prefers-reduced-motion: reduce) {
        .block-editor-undo-enter-active,
        .block-editor-undo-leave-active {
            transition: none;
        }
    }
</style>
