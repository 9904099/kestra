<template>
    <component
        v-if="presentation !== 'panel'"
        :is="component"
        :icon="CodeTags"
        @click="onShow"
        ref="taskEdit"
    >
        <span v-if="component !== 'KsButton' && !isHidden">{{ $t("show task source") }}</span>
        <KsDrawer
            v-if="isModalOpen"
            v-model="isModalOpen"
            :beforeClose="beforeClose"
            :size="size"
        >
            <template #header>
                <code>{{ taskId || task?.id || $t("add task") }}</code>
            </template>
            <template #footer>
                <div v-ks-loading="isLoading">
                    <ValidationError class="me-2" link :errors="errors" />

                    <KsButton
                        :icon="ContentSave"
                        @click="saveTask"
                        v-if="canSave && !readOnly"
                        :disabled="errors && !!errors.length"
                        type="primary"
                    >
                        {{ $t("save task") }}
                    </KsButton>
                    <KsAlert
                        :closable="false"
                        class="mb-0 mt-3"
                        v-if="revision && revisions?.length !== revision"
                        type="warning"
                    >
                        <strong>{{ $t("seeing old revision", {revision: revision}) }}</strong>
                    </KsAlert>
                </div>
            </template>

            <TaskEditPanes
                :modelValue="taskYaml"
                :activeTab="activeTabs"
                :section="section"
                :readOnly="readOnly"
                :pluginMarkdown="pluginMarkdown"
                :editorPath="editorUri"
                @update:activeTab="activeTabs = $event"
                @input="onInput"
                @save="saveTask"
            />
        </KsDrawer>
    </component>

    <div
        v-else-if="isModalOpen"
        ref="panelRef"
        class="task-edit-panel"
        data-test="task-edit-panel"
        @focusin="onPanelFocusIn"
        @focusout="onPanelFocusOut"
        @dragover.prevent
        @drop="emit('tab-drop')"
    >
        <div v-if="!hideTabstrip" class="task-edit-tabstrip">
            <!-- Draggable so tiled panes can be swapped side-to-side by
            dropping this label onto another pane. -->
            <div
                class="task-edit-tab"
                draggable="true"
                data-test="task-edit-tab"
                @dragstart="onTabDragStart"
            >
                <KsTaskIcon class="task-edit-tab-ico" :cls="taskType" :icons="pluginsStore.icons" :onlyIcon="true" />
                <span class="task-edit-tab-id">{{ taskId || task?.id || $t("add task") }}</span>
                <KsIconButton
                    class="task-edit-tab-close"
                    :aria-label="$t('close')"
                    :tooltip="$t('close')"
                    data-test="task-edit-tab-close"
                    @click="emit('close')"
                >
                    <Close />
                </KsIconButton>
            </div>
        </div>

        <div class="task-edit-panel-body">
            <TaskEditData
                class="task-edit-col task-edit-col-inputs"
                :class="{'task-edit-col--collapsed': inputsCollapsed}"
                kind="inputs"
                :title="$t('block_editor.inputs')"
                :subtitle="$t('block_editor.inputs_sub')"
                :sections="inputSections"
                :filterable="true"
                :collapsible="true"
                :isCollapsed="inputsCollapsed"
                :stacked="isStacked"
                side="left"
                @toggle="inputsCollapsed = !inputsCollapsed"
            />

            <div class="task-edit-col task-edit-col-params">
                <div class="task-edit-params-toolbar">
                    <KsButton
                        v-if="isRunnable"
                        size="small"
                        :icon="Play"
                        data-test="task-edit-run"
                        @click="runTask(runnableTaskId)"
                    >
                        {{ $t("playground.run_task") }}
                    </KsButton>
                    <KsButton
                        size="small"
                        :type="docOpen ? 'primary' : 'default'"
                        :icon="BookOpenPageVariantOutline"
                        data-test="task-edit-doc-toggle"
                        @click="docOpen = !docOpen"
                    >
                        {{ $t("documentation.documentation") }}
                    </KsButton>
                </div>
                <TaskEditPanes
                    class="task-edit-panes"
                    :modelValue="taskYaml"
                    :activeTab="activeTabs"
                    :section="section"
                    :readOnly="readOnly"
                    :pluginMarkdown="null"
                    :editorPath="editorUri"
                    :hideRunButton="true"
                    @update:activeTab="activeTabs = $event"
                    @input="onInput"
                    @save="saveTask"
                />
            </div>

            <TaskEditData
                v-if="outputSections.length"
                class="task-edit-col task-edit-col-output"
                :class="{'task-edit-col--collapsed': outputCollapsed}"
                kind="output"
                :title="$t('block_editor.output')"
                :subtitle="$t('block_editor.output_sub')"
                :sections="outputSections"
                :collapsible="true"
                :isCollapsed="outputCollapsed"
                :stacked="isStacked"
                :interactive="false"
                side="right"
                @toggle="outputCollapsed = !outputCollapsed"
            />

        </div>

        <KsDrawer
            v-if="docOpen"
            v-model="docOpen"
            direction="rtl"
            resizable
            size="sm"
            :title="$t('documentation.documentation')"
            data-test="task-edit-doc-panel"
        >
            <div class="task-edit-doc-body">
                <KsMarkdown v-if="pluginMarkdown" :content="pluginMarkdown" />
                <p v-else class="task-edit-doc-empty">{{ $t("block_editor.no_documentation") }}</p>
            </div>
        </KsDrawer>

        <div v-if="errors && errors.length" v-ks-loading="isLoading" class="task-edit-panel-footer">
            <div class="task-edit-validation-status" role="status" aria-live="polite">
                <ValidationError link :errors="errors" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {ref, computed, watch, onMounted} from "vue"
    import {useI18n} from "vue-i18n"
    import {SECTIONS, KsTaskIcon, KsIconButton, KsMarkdown, KsDrawer} from "@kestra-io/design-system"
    import {flowYamlUtils as YAML_UTILS} from "@kestra-io/topology"
    import CodeTags from "vue-material-design-icons/CodeTags.vue"
    import ContentSave from "vue-material-design-icons/ContentSave.vue"
    import Close from "vue-material-design-icons/Close.vue"
    import BookOpenPageVariantOutline from "vue-material-design-icons/BookOpenPageVariantOutline.vue"
    import Play from "vue-material-design-icons/Play.vue"
    import TaskEditPanes from "./TaskEditPanes.vue"
    import TaskEditData from "./TaskEditData.vue"
    import {canSaveFlowTemplate} from "../../utils/flowTemplate"
    import ValidationError from "./ValidationError.vue"
    import {usePluginsStore} from "../../stores/plugins"
    import {useAuthStore} from "override/stores/auth"
    import {useFlowStore} from "../../stores/flow"
    import {useDiscardGuard} from "../../composables/useDiscardGuard"
    import {usePlaygroundRun} from "../../composables/playground/usePlaygroundRun"

    interface Props {
        component?: string;
        task?: Record<string, any>;
        taskRaw?: string;
        taskId?: string;
        flowId: string;
        namespace: string;
        revision?: number;
        section?: string;
        emitOnly?: boolean;
        emitTaskOnly?: boolean;
        isHidden?: boolean;
        readOnly?: boolean;
        flowSource?: string;
        size?: string;
        presentation?: "drawer" | "panel";
        hideTabstrip?: boolean;
        editorKey?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        component: "KsButton",
        task: undefined,
        taskRaw: undefined,
        taskId: undefined,
        revision: undefined,
        section: SECTIONS.TASKS,
        emitOnly: false,
        emitTaskOnly: false,
        isHidden: false,
        readOnly: false,
        flowSource: undefined,
        size: undefined,
        presentation: "drawer",
        hideTabstrip: false,
        editorKey: undefined,
    })

    const emit = defineEmits<{
        "update:task": [value: string];
        "close": [];
        "tab-drag-start": [];
        "tab-drop": [];
    }>()

    function onTabDragStart(event: DragEvent) {
        // Both are required for the browser to actually start a native drag.
        event.dataTransfer?.setData("text/plain", "dock-pane-tab")
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
        emit("tab-drag-start")
    }

    const pluginsStore = usePluginsStore()
    const {t} = useI18n()

    const taskYaml = ref("")
    const taskBaseline = ref("")
    const isModalOpen = ref(false)
    const {guardedClose} = useDiscardGuard(() => taskYaml.value !== taskBaseline.value)
    const beforeClose = (done: () => void) => guardedClose(() => done())
    const activeTabs = ref(props.readOnly ? "source" : "form")
    const docOpen = defineModel<boolean>("docOpen", {default: false})
    const inputsCollapsed = defineModel<boolean>("inputsCollapsed", {default: false})
    const outputCollapsed = defineModel<boolean>("outputCollapsed", {default: true})

    const panelRef = ref<HTMLElement>()
    const isStacked = ref(false)
    const panelHasFocus = ref(false)

    const onPanelFocusIn = () => {
        panelHasFocus.value = true
    }
    const onPanelFocusOut = (event: FocusEvent) => {
        const next = event.relatedTarget as Node | null
        if (!next || !panelRef.value?.contains(next)) {
            panelHasFocus.value = false
        }
    }

    watch(panelRef, (el, _previous, onCleanup) => {
        if (!el) return
        const observer = new ResizeObserver((entries) => {
            isStacked.value = (entries[0]?.contentRect.width ?? el.clientWidth) <= 760
        })
        observer.observe(el)
        onCleanup(() => observer.disconnect())
    }, {immediate: true})

    watch(isStacked, (stacked) => {
        inputsCollapsed.value = stacked
        outputCollapsed.value = stacked
    })
    const type = ref<string>()
    const revisions = ref<any[]>()
    const timer = ref<ReturnType<typeof setTimeout>>()
    const lastValidatedValue = ref<string | null>(null)

    const {runTask, playgroundStore} = usePlaygroundRun()

    const runnableTaskId = computed<string | undefined>(() =>
        props.taskId ?? props.task?.id ?? YAML_UTILS.parse(taskYaml.value)?.id,
    )

    const isRunnable = computed(() =>
        playgroundStore.enabled
        && !props.readOnly
        && props.section?.toLowerCase() !== "triggers"
        && Boolean(runnableTaskId.value),
    )

    const taskType = computed(() => {
        try {
            return YAML_UTILS.parse(taskYaml.value)?.type ?? props.task?.type ?? ""
        } catch {
            return props.task?.type ?? ""
        }
    })

    const flowStore = useFlowStore()
    const errors = computed(() => flowStore.taskError?.split(/, ?/))
    const pluginMarkdown = computed(() => {
        if (pluginsStore?.plugin?.markdown && YAML_UTILS.parse(taskYaml.value)?.type) {
            return pluginsStore?.plugin.markdown
        }
        return null
    })

    function flattenTaskIds(tasks: any, acc: string[]) {
        if (!Array.isArray(tasks)) return
        for (const task of tasks) {
            if (task?.id) acc.push(String(task.id))
            for (const key of ["tasks", "then", "else", "errors", "finally", "defaults"]) flattenTaskIds(task?.[key], acc)
            if (task?.cases && typeof task.cases === "object") {
                for (const branch of Object.values(task.cases)) flattenTaskIds(branch, acc)
            }
        }
    }

    const currentTaskId = computed(() => String(props.taskId ?? props.task?.id ?? ""))

    // Monaco keys its model off this: it must stay stable while the id is being
    // edited (otherwise the model is swapped mid-edit and the cursor resets), so
    // prefer the caller's stable key (the block's path) over the mutable id.
    const editorUri = computed(() => props.editorKey || currentTaskId.value)

    const inputSections = computed(() => {
        const flow = flowStore.flowParsed ?? {}
        const sections: {key: string; label: string; chips: {label: string; expr: string}[]}[] = []

        const ids: string[] = []
        flattenTaskIds(flow.tasks, ids)
        flattenTaskIds(flow.errors, ids)
        flattenTaskIds(flow.finally, ids)
        const upstream = [...new Set(ids)].filter(id => id && id !== currentTaskId.value)
        if (upstream.length) {
            sections.push({key: "outputs", label: t("block_editor.upstream_outputs"), chips: upstream.map(id => ({label: id, expr: `{{ outputs.${id} }}`}))})
        }

        const inputs = Array.isArray(flow.inputs) ? flow.inputs : []
        if (inputs.length) {
            sections.push({key: "inputs", label: t("block_editor.flow_inputs"), chips: inputs.map((i: any) => {
                const id = String(i.id ?? i.name ?? "")
                return {label: id, expr: `{{ inputs.${id} }}`}
            })})
        }

        const ctx = [
            {label: "flow.id", expr: "{{ flow.id }}"},
            {label: "flow.namespace", expr: "{{ flow.namespace }}"},
            {label: "execution.id", expr: "{{ execution.id }}"},
            {label: "execution.startDate", expr: "{{ execution.startDate }}"},
            {label: "taskrun.id", expr: "{{ taskrun.id }}"},
            {label: "trigger.date", expr: "{{ trigger.date }}"},
            {label: "now()", expr: "{{ now() }}"},
            {label: "labels", expr: "{{ labels }}"},
        ]
        if (flow.variables && typeof flow.variables === "object") {
            for (const key of Object.keys(flow.variables)) ctx.push({label: `vars.${key}`, expr: `{{ vars.${key} }}`})
        }
        sections.push({key: "context", label: t("block_editor.execution_context"), chips: ctx})

        return sections
    })

    const outputSections = computed(() => {
        const candidates = [
            (pluginsStore.plugin as any)?.schema?.outputs?.properties,
            (pluginsStore.plugin as any)?.outputs?.properties,
            (pluginsStore.editorPlugin as any)?.schema?.outputs?.properties,
            (pluginsStore.editorPlugin as any)?.outputs?.properties,
        ]
        const properties = candidates.find(c => c && typeof c === "object")
        const names = properties ? Object.keys(properties) : []
        if (!names.length) return []
        const chips = names.map(name => ({
            label: name,
            type: String((properties as Record<string, {type?: string}>)[name]?.type ?? "") || undefined,
        }))
        return [{key: "out", label: t("block_editor.declared_outputs"), chips}]
    })

    const authStore = useAuthStore()

    const canSave = computed(() => {
        const user = authStore.user
        return canSaveFlowTemplate(true, user, {namespace: props.namespace}, "flow")
    })

    const isLoading = computed(() => taskYaml.value === undefined)

    const source = computed(() => {
        return props.revision
            ? revisions.value?.[props.revision - 1]?.source
            : flowStore.flow?.source
    })

    const load = async (taskId: string) => {
        await flowStore.loadFlow({
            namespace: props.namespace,
            id: props.flowId,
            revision: props.revision?.toString(),
        })
        if (props.revision) {
            if (!revisions.value?.[props.revision - 1]) {
                revisions.value = await flowStore.loadRevisions({
                    namespace: props.namespace,
                    id: props.flowId,
                    store: false,
                })
            }
        }
        return YAML_UTILS.extractBlock({
            section: props.section,
            source: source.value,
            key: taskId,
        })
    }

    const saveTask = () => {
        if (props.presentation === "panel") {
            if (timer.value) {
                clearTimeout(timer.value)
                timer.value = undefined
            }
            emit("update:task", taskYaml.value)
            taskBaseline.value = taskYaml.value
            return
        }
        emit("update:task", taskYaml.value)
        taskYaml.value = ""
        isModalOpen.value = false
    }

    const onShow = async () => {
        isModalOpen.value = true
        if (props.taskId) {
            taskYaml.value = await load(props.taskId ? props.taskId : props.task?.id) ?? ""
        } else if (props.taskRaw != null) {
            taskYaml.value = props.taskRaw
        } else if (props.task) {
            taskYaml.value = YAML_UTILS.stringify(props.task)
        }
        taskBaseline.value = taskYaml.value
        if (props.task?.type) {
            pluginsStore.load({cls: props.task.type}).catch(() => {})
        }
    }

    const commitEdit = () => {
        if (lastValidatedValue.value !== taskYaml.value) {
            lastValidatedValue.value = taskYaml.value
            flowStore.validateTask({
                task: taskYaml.value,
                section: props.section,
            })
        }
        if (props.presentation === "panel") {
            let parsed: unknown
            try { parsed = YAML_UTILS.parse(taskYaml.value) } catch { parsed = undefined }
            // Don't push half-typed / unparseable YAML into the flow: it corrupts the document.
            if (!parsed || typeof parsed !== "object") return
            emit("update:task", taskYaml.value)
            taskBaseline.value = taskYaml.value
        }
    }

    const onInput = (value?: string | Record<string, any>) => {
        if (timer.value) {
            clearTimeout(timer.value)
        }

        taskYaml.value = typeof value === "string" ? value : YAML_UTILS.stringify(value ?? "")
        timer.value = setTimeout(commitEdit, 500) as any
    }

    // Called before a save so a pending debounced edit is never silently
    // dropped by a Cmd/Ctrl+S pressed right after typing.
    const flushPendingEdit = () => {
        if (!timer.value) return
        clearTimeout(timer.value)
        timer.value = undefined
        commitEdit()
    }

    // Semantic normalization so an echo that only differs in formatting
    // (re-indentation from the round-trip through the flow) still counts as
    // "unchanged" and doesn't clobber in-progress Source edits.
    const normalizeYaml = (yaml?: string): string | undefined => {
        if (yaml == null) return undefined
        try {
            return JSON.stringify(YAML_UTILS.parse(yaml) ?? {})
        } catch {
            return yaml
        }
    }

    watch([() => props.task, () => props.taskRaw], async ([newTask, raw]) => {
        if (!newTask && raw == null) {
            taskYaml.value = ""
            return
        }
        // Prefer the raw slice (comments + exact quoting preserved) over
        // re-serializing the parsed task, which drops both.
        const incoming = raw ?? YAML_UTILS.stringify(newTask)
        // In the block editor the Source tab shares its flow document with the
        // Flow Code pane, so an edit in either must surface live in the other.
        // While the panel holds focus the incoming value is only the echo of the
        // user's own commit — adopting it would reset Monaco and their cursor —
        // so it is kept out. Once focus is elsewhere the shared document wins and
        // the slice is adopted verbatim, including the comment / quoting /
        // formatting-only changes the drawer's semantic guard swallows.
        const keepLocalEdit = props.presentation === "panel"
            ? panelHasFocus.value
            : normalizeYaml(incoming) === normalizeYaml(taskBaseline.value)
        if (incoming !== taskYaml.value && !keepLocalEdit) {
            taskYaml.value = incoming
            taskBaseline.value = incoming
        }
        const taskType = newTask?.type ?? YAML_UTILS.parse(incoming)?.type
        if (taskType) {
            await pluginsStore.load({cls: taskType}).catch(() => {})
        }
    }, {immediate: true})

    const typeLoadTimer = ref<ReturnType<typeof setTimeout>>()
    watch(taskYaml, () => {
        const task = YAML_UTILS.parse(taskYaml.value)
        if (task?.type && task.type !== type.value) {
            type.value = task.type
            // Debounced: typing the type in Source changes it per keystroke, and
            // loading each partial fqcn ("io", "io.k", …) 404s.
            clearTimeout(typeLoadTimer.value)
            typeLoadTimer.value = setTimeout(() => pluginsStore.load({cls: task.type}).catch(() => {}), 500)
        }
    })

    watch(isModalOpen, () => {
        if (!isModalOpen.value) {
            emit("close")
            activeTabs.value = props.readOnly ? "source" : "form"
        }
    })

    onMounted(() => {
        if (props.presentation === "panel") onShow()
    })

    defineExpose({open: onShow, flushPendingEdit})
</script>

<style scoped lang="scss">
    .task-edit-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        background: var(--ks-bg-surface);
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-lg);
        overflow: hidden;
        container-type: inline-size;
    }

    .task-edit-tabstrip {
        display: flex;
        align-items: flex-end;
        gap: var(--ks-spacing-1);
        padding: var(--ks-spacing-2) var(--ks-spacing-2) 0;
        background: var(--ks-bg-base);
        border-bottom: 1px solid var(--ks-border-subtle);
    }

    .task-edit-tab {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        padding: var(--ks-spacing-2) var(--ks-spacing-3);
        background: var(--ks-bg-surface);
        border: 1px solid var(--ks-border-subtle);
        border-bottom: none;
        border-radius: var(--ks-radius-base) var(--ks-radius-base) 0 0;
    }

    .task-edit-tab-ico {
        flex-shrink: 0;
        width: var(--ks-icon-size-base);
        height: var(--ks-icon-size-base);
    }

    .task-edit-tab-id {
        font-size: var(--ks-font-size-sm);
        font-weight: 600;
        font-family: var(--ks-font-family-mono);
        color: var(--ks-text-primary);
    }

    .task-edit-panel-body {
        flex: 1;
        min-height: 0;
        display: flex;
    }

    .task-edit-col {
        min-width: 0;
        min-height: 0;
        height: 100%;
    }

    .task-edit-col-inputs {
        flex: 0 0 220px;
        border-right: 1px solid var(--ks-border-subtle);
    }

    .task-edit-col-output {
        flex: 0 0 230px;
        border-left: 1px solid var(--ks-border-subtle);
    }

    .task-edit-col-inputs.task-edit-col--collapsed,
    .task-edit-col-output.task-edit-col--collapsed {
        flex: 0 0 2.5rem;
    }

    .task-edit-col-params {
        position: relative;
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
    }

    @mixin task-edit-stacked {
        flex-direction: column;
        overflow-y: auto;

        .task-edit-col {
            flex: none;
            width: 100%;
            height: auto;
            border: none;
            border-bottom: 1px solid var(--ks-border-subtle);
        }

        .task-edit-col-params {
            order: -1;
            flex: 1 1 0;
            min-height: 0;
        }

        .task-edit-col-inputs.task-edit-col--collapsed,
        .task-edit-col-output.task-edit-col--collapsed {
            flex: none;
            width: 100%;
        }
    }

    @container (max-width: 760px) {
        .task-edit-panel-body {
            @include task-edit-stacked;
        }
    }

    .task-edit-params-toolbar {
        position: absolute;
        top: var(--ks-spacing-5);
        right: var(--ks-spacing-5);
        z-index: 1;
        display: flex;
        gap: var(--ks-spacing-2);
    }

    @container (max-width: 550px) {
        .task-edit-params-toolbar {
            position: static;
            justify-content: flex-end;
            padding: var(--ks-spacing-3) var(--ks-spacing-5) 0;
        }
    }

    .task-edit-panes {
        flex: 1;
        min-height: 0;
        padding: var(--ks-spacing-5) 0 var(--ks-spacing-6);
    }

    .task-edit-doc-body {
        min-height: 0;
        overflow-y: auto;
        padding: var(--ks-spacing-4) var(--ks-spacing-5);
    }

    .task-edit-doc-empty {
        margin: var(--ks-spacing-6) 0;
        text-align: center;
        font-size: var(--ks-font-size-sm);
        color: var(--ks-text-muted);
    }

    .task-edit-panel-footer {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: var(--ks-spacing-3);
        flex-shrink: 0;
        padding: var(--ks-spacing-3) var(--ks-spacing-4);
        border-top: 1px solid var(--ks-border-subtle);
        background: var(--ks-bg-surface);
    }

    .task-edit-validation-status {
        display: flex;
        align-items: center;
    }
</style>
