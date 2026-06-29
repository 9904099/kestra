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
                @update:activeTab="activeTabs = $event"
                @input="onInput"
                @save="saveTask"
            />
        </KsDrawer>
    </component>

    <div
        v-else-if="isModalOpen"
        class="task-edit-panel"
        data-test="task-edit-panel"
    >
        <div class="task-edit-tabstrip">
            <div class="task-edit-tab">
                <KsTaskIcon class="task-edit-tab-ico" :cls="taskType" :icons="pluginsStore.icons" :onlyIcon="true" />
                <span class="task-edit-tab-id">{{ taskId || task?.id || $t("add task") }}</span>
                <KsIconButton
                    class="task-edit-tab-close"
                    :aria-label="$t('close')"
                    :tooltip="$t('close')"
                    @click="isModalOpen = false"
                >
                    <Close />
                </KsIconButton>
            </div>
        </div>

        <div class="task-edit-panel-body">
            <TaskEditPanes
                :modelValue="taskYaml"
                :activeTab="activeTabs"
                :section="section"
                :readOnly="readOnly"
                :pluginMarkdown="pluginMarkdown"
                @update:activeTab="activeTabs = $event"
                @input="onInput"
                @save="saveTask"
            />
        </div>

        <div v-ks-loading="isLoading" class="task-edit-panel-footer">
            <ValidationError link :errors="errors" />
            <KsButton
                v-if="canSave && !readOnly"
                :icon="ContentSave"
                :disabled="errors && !!errors.length"
                type="primary"
                @click="saveTask"
            >
                {{ $t("save task") }}
            </KsButton>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {ref, computed, watch} from "vue"
    import {SECTIONS, KsTaskIcon, KsIconButton} from "@kestra-io/design-system"
    import {flowYamlUtils as YAML_UTILS} from "@kestra-io/topology"
    import CodeTags from "vue-material-design-icons/CodeTags.vue"
    import ContentSave from "vue-material-design-icons/ContentSave.vue"
    import Close from "vue-material-design-icons/Close.vue"
    import TaskEditPanes from "./TaskEditPanes.vue"
    import {canSaveFlowTemplate} from "../../utils/flowTemplate"
    import ValidationError from "./ValidationError.vue"
    import {usePluginsStore} from "../../stores/plugins"
    import {useAuthStore} from "override/stores/auth"
    import {useFlowStore} from "../../stores/flow"
    import {useDiscardGuard} from "../../composables/useDiscardGuard"

    interface Props {
        component?: string;
        task?: Record<string, any>;
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
    }

    const props = withDefaults(defineProps<Props>(), {
        component: "KsButton",
        task: undefined,
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
    })

    const emit = defineEmits<{
        "update:task": [value: string];
        "close": [];
    }>()

    const pluginsStore = usePluginsStore()

    const taskYaml = ref("")
    const taskBaseline = ref("")
    const isModalOpen = ref(false)
    const {guardedClose} = useDiscardGuard(() => taskYaml.value !== taskBaseline.value)
    const beforeClose = (done: () => void) => guardedClose(() => done())
    const activeTabs = ref(props.readOnly ? "source" : "form")
    const type = ref<string>()
    const revisions = ref<any[]>()
    const timer = ref<ReturnType<typeof setTimeout>>()
    const lastValidatedValue = ref<string | null>(null)

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
        emit("update:task", taskYaml.value)
        taskYaml.value = ""
        isModalOpen.value = false
    }

    const onShow = async () => {
        isModalOpen.value = true
        if (props.taskId) {
            taskYaml.value = await load(props.taskId ? props.taskId : props.task?.id) ?? ""
        } else if (props.task) {
            taskYaml.value = YAML_UTILS.stringify(props.task)
        }
        taskBaseline.value = taskYaml.value
        if (props.task?.type) {
            pluginsStore.load({cls: props.task.type})
        }
    }

    const onInput = (value?: string | Record<string, any>) => {
        if (timer.value) {
            clearTimeout(timer.value)
        }

        taskYaml.value = typeof value === "string" ? value : YAML_UTILS.stringify(value ?? "")

        timer.value = setTimeout(() => {
            if (lastValidatedValue.value !== taskYaml.value) {
                lastValidatedValue.value = taskYaml.value
                flowStore.validateTask({
                    task: taskYaml.value,
                    section: props.section,
                })
            }
        }, 500) as any
    }

    watch(() => props.task, async (newTask) => {
        if (newTask) {
            taskYaml.value = YAML_UTILS.stringify(newTask)
            if (newTask.type) {
                await pluginsStore.load({cls: newTask.type})
            }
        } else {
            taskYaml.value = ""
        }
    }, {immediate: true})

    watch(taskYaml, () => {
        const task = YAML_UTILS.parse(taskYaml.value)
        if (task?.type && task.type !== type.value) {
            pluginsStore.load({cls: task.type})
            type.value = task.type
        }
    })

    watch(isModalOpen, () => {
        if (!isModalOpen.value) {
            emit("close")
            activeTabs.value = props.readOnly ? "source" : "form"
        }
    })

    defineExpose({open: onShow})
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
        overflow-y: auto;
        padding: var(--ks-spacing-4);
    }

    .task-edit-panel-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--ks-spacing-3);
        padding: var(--ks-spacing-3) var(--ks-spacing-4);
        border-top: 1px solid var(--ks-border-subtle);
    }
</style>
