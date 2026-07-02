<template>
    <div class="wrapper" :class="{'wrapper--toggle': hasToggle}">
        <KsDatePicker
            v-if="!pebble && schema?.format === 'date-time'"
            :modelValue="modelValue"
            type="date"
            :placeholder="$t('no_code.choose_placeholder', {field: root || 'date'})"
            @update:model-value="(v: Date | string | null) => onInput(v instanceof Date ? v.toISOString() : '')"
        />
        <TaskDuration
            v-if="!pebble && schema?.format === 'duration'"
            :modelValue="typeof modelValue === 'string' ? modelValue : undefined"
            class="duration-field"
            @update:model-value="onInput"
        />
        <TaskBoolean
            v-if="!pebble && schema?.type === 'boolean'"
            :modelValue="typeof modelValue === 'boolean' ? modelValue : undefined"
            class="boolean-field"
            @update:model-value="onInput"
        />
        <InputText
            v-if="disabled"
            :modelValue="String(modelValue ?? '')"
            disabled
            class="w-100 disabled-field"
        />
        <KsEditor
            v-else-if="pebble || (!schema?.format && schema?.type !== 'boolean')"
            v-bind="editorBindings"
            :modelValue="editorValue"
            :navbar="false"
            :options="{fullHeight: false, largeSuggestions: false}"
            schemaType="flow"
            :lang="`${editorLanguage}-pebble`"
            :placeholder="placeholder"
            inline
            @update:model-value="onInput"
            style="z-index: 1;"
        />
        <KsButton
            v-if="hasToggle"
            :icon="IconCodeTags"
            size="small"
            class="code-toggle"
            :class="{'code-toggle--active': pebble}"
            :title="$t('no_code.toggle_pebble')"
            :aria-label="$t('no_code.toggle_pebble')"
            @click="pebble = !pebble"
        />
    </div>
</template>
<script lang="ts" setup>
    import {ref, computed, onMounted} from "vue"
    import $moment from "moment"
    import IconCodeTags from "vue-material-design-icons/CodeTags.vue"
    import {KsEditor} from "@kestra-io/design-system"
    import {useEditorBindings} from "../../../../composables/useEditorBindings"
    import InputText from "../inputs/InputText.vue"
    import TaskDuration from "./TaskDuration.vue"
    import TaskBoolean from "./TaskBoolean.vue"
    import {Schema} from "./getTaskComponent"

    defineOptions({inheritAttrs: false})

    const editorBindings = useEditorBindings()

    const props = defineProps<{
        disabled?: boolean;
        modelValue?: string | boolean;
        schema?: Schema;
        root?: string;
        task?: any;
    }>()

    const emit = defineEmits<{
        (e: "update:modelValue", value: string | boolean | undefined): void;
    }>()


    const pebble = ref(false)

    const hasToggle = computed(() =>
        ["duration", "date-time"].includes(props.schema?.format ?? "") || props.schema?.type === "boolean",
    )

    // Computed property for editor language
    const editorLanguage = computed(() => {
        return props.schema?.$language ?? "plaintext"
    })

    const values = computed(() => {
        if (props.modelValue === undefined) {
            return props.schema?.default
        }

        return props.modelValue
    })

    onMounted(() => {
        const schema = props.schema
        if (!schema) return

        if (schema.type === "boolean") {
            pebble.value = typeof props.modelValue === "string" && props.modelValue !== ""
        } else if (!["duration", "date-time"].includes(schema.format ?? "") || !props.modelValue) {
            pebble.value = false
        } else if (schema.format === "duration" && values.value) {
            pebble.value = !$moment.duration(props.modelValue as string).isValid()
        } else if (schema.format === "date-time" && values.value) {
            pebble.value = isNaN(Date.parse(props.modelValue as string))
        }
    })

    function onInput(value: string | boolean | null | undefined) {
        emit("update:modelValue", value ?? undefined)
    }

    const editorValue = computed(() => typeof props.modelValue === "string" ? props.modelValue : undefined)

    const placeholder = computed(() => props.root?.split(".").pop() ?? "")

</script>

<style scoped lang="scss">
:deep(.kel-input__inner) {
    &::placeholder {
        color: var(--ks-text-inactive) !important;
    }
}
:deep(.placeholder) {
    top: -7px !important;
}

.wrapper {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    border-radius: var(--ks-radius-base);
    border: 1px solid var(--ks-border-default);
    overflow: hidden;
    width: 100%;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;

    :deep(.disabled-field) {
        margin: 0!important;
        border-radius: 4px;
    }

    :deep(.ks-editor){
        flex: 1;
    }
}

.wrapper:not(.wrapper--toggle) :deep(.kel-input__wrapper),
.wrapper:not(.wrapper--toggle) :deep(.editor-container) {
    box-shadow: none;
}

.wrapper:not(.wrapper--toggle):focus-within {
    border-color: var(--ks-border-focus);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ks-border-focus) 22%, transparent);
}

.wrapper--toggle {
    border: none;
    overflow: visible;
    align-items: flex-start;
    gap: var(--ks-spacing-2);
}

.wrapper--toggle > :not(.code-toggle) {
    flex: 1;
    min-width: 0;
}

.wrapper--toggle :deep(.ks-editor) {
    border: 1px solid var(--ks-border-default);
    border-radius: var(--ks-radius-base);
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.wrapper--toggle :deep(.ks-editor:focus-within) {
    border-color: var(--ks-border-focus);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ks-border-focus) 22%, transparent);
}

.code-toggle {
    flex-shrink: 0;
    margin: 0 !important;
    background-color: transparent;
    border-color: transparent;
}

.code-toggle :deep(svg) {
    color: var(--ks-icon-muted) !important;
    font-size: var(--ks-font-size-md);
}

.code-toggle:hover {
    background-color: var(--ks-bg-hover);
}

.code-toggle:hover :deep(svg) {
    color: var(--ks-text-link) !important;
}

.code-toggle--active {
    background-color: var(--ks-bg-tag-hover);
    border-color: var(--ks-btn-secondary-border-active);
}

.code-toggle--active :deep(svg) {
    color: var(--ks-text-link) !important;
}
</style>
