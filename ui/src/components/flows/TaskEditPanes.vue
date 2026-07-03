<template>
    <KsTabs paneScroll :modelValue="activeTab" @update:modelValue="(v) => emit('update:activeTab', v ?? '')">
        <KsTabPane v-if="!readOnly" name="form">
            <template #label>
                <span>{{ $t("form") }}</span>
            </template>
            <TaskEditor
                :modelValue="modelValue"
                :section="section"
                @update:model-value="(v) => emit('input', v ?? '')"
            />
        </KsTabPane>
        <KsTabPane name="source">
            <template #label>
                <span>{{ $t("source") }}</span>
            </template>
            <KsEditor
                v-bind="editorBindings"
                :readOnly="readOnly"
                :modelValue="modelValue"
                :schemaType="section.toLowerCase()"
                :path="editorPath"
                :options="{fullHeight: false}"
                :navbar="false"
                lang="yaml"
                @save="emit('save')"
                @update:model-value="(v) => emit('input', v ?? '')"
            />
        </KsTabPane>
        <KsTabPane v-if="pluginMarkdown" name="documentation">
            <template #label>
                <span>{{ $t("documentation.documentation") }}</span>
            </template>
            <div class="documentation">
                <KsMarkdown :content="pluginMarkdown" />
            </div>
        </KsTabPane>
    </KsTabs>
</template>

<script setup lang="ts">
    import {KsMarkdown, KsEditor} from "@kestra-io/design-system"
    import {useEditorBindings} from "../../composables/useEditorBindings"
    import TaskEditor from "../no-code/components/TaskEditor.vue"

    withDefaults(defineProps<{
        modelValue: string
        section: string
        activeTab: string
        readOnly?: boolean
        pluginMarkdown?: string | null
        // Gives the Source tab's Monaco model a unique URI per open task. Without
        // it, KsEditor derives the URI from schemaType alone, so two tasks in the
        // same section (e.g. two open dock tabs) resolve to the SAME Monaco model
        // and silently share content — editing one's Source tab overwrites the
        // other's, even though it's never visible.
        editorPath?: string
    }>(), {
        readOnly: false,
        pluginMarkdown: null,
        editorPath: undefined,
    })

    const emit = defineEmits<{
        "input": [value: string | Record<string, any>]
        "update:activeTab": [value: string]
        "save": []
    }>()

    const editorBindings = useEditorBindings()
</script>

<style scoped lang="scss">
    .documentation {
        padding: var(--ks-spacing-4);
    }
</style>
