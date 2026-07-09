<template>
    <TaskObjectListInline
        v-if="inlineMode && simpleType === 'list'"
        v-model="modelValue"
        :fieldKey
        :root="componentProps.root"
        :taskSchemaPath
    />

    <component
        v-else-if="simpleType === 'list'"
        ref="taskComponent"
        :is="type"
        v-bind="componentProps"
        :disabled
        class="mt-1 mb-2 wrapper"
    />
    <component
        v-else-if="frameRoot"
        ref="taskComponent"
        :is="type"
        v-bind="componentProps"
        :bare="true"
        :disabled
        class="wrapper"
    />
    <div v-else-if="isNestedObject" class="nested-card">
        <div class="nested-card-head">
            <span class="nested-card-label">{{ fieldKey }}</span>
            <span class="type-pill">{{ simpleType }}</span>
            <KsTooltip
                v-if="hasTooltip && !inlineHelp"
                placement="left-start"
                :showArrow="false"
                popperClass="singleton-tooltip"
            >
                <template #content>
                    <KsMarkdown class="markdown-tooltip" :content="helpText" />
                </template>
                <Help />
            </KsTooltip>
        </div>
        <div class="nested-card-body">
            <component
                ref="taskComponent"
                :is="type"
                v-bind="componentProps"
                :bare="true"
                :disabled
            />
            <KsMarkdown
                v-if="inlineHelp && inlineHelpText"
                class="field-help"
                :content="inlineHelpText"
            />
        </div>
    </div>
    <KsFormItem v-else-if="fieldKey" :required="isRequired">
        <template #label>
            <div class="inline-wrapper">
                <div class="inline-start">
                    <TaskLabelWithBoolean
                        :type="simpleType"
                        :isBoolean="isBoolean"
                        :componentProps="componentProps"
                    />
                    <span v-if="props.fieldKey" class="label">
                        {{ props.fieldKey }}
                    </span>

                    <span
                        v-if="pluginDefault !== undefined"
                        class="plugin-default-hint"
                        :title="t('block_editor.plugin_default_tooltip')"
                    >
                        {{ t("block_editor.plugin_default", {value: pluginDefault}) }}
                    </span>

                    <ClearButton
                        v-if="isAnyOf && !isRequired && hasSelectedASchema"
                        @click="modelValue = undefined; taskComponent?.resetSelectType?.();"
                    />
                </div>
                <span v-if="!isAnyOf" class="type-pill">{{ simpleType }}</span>
                <KsTooltip
                    v-if="!isAnyOf && hasTooltip && !inlineHelp"
                    placement="left-start"
                    :showArrow="false"
                    popperClass="singleton-tooltip"
                >
                    <template #content>
                        <KsMarkdown
                            class="markdown-tooltip"
                            :content="helpText"
                        />
                    </template>
                    <Help />
                </KsTooltip>
            </div>
        </template>
        <TaskObjectTaskInline
            v-if="inlineMode && simpleType === 'task'"
            v-model="modelValue"
            :parentPath="componentProps.root"
            :taskSchemaPath
        />
        <component
            v-else-if="!isBoolean"
            ref="taskComponent"
            :is="type"
            v-bind="componentProps"
            :disabled
            class="mt-1 mb-2 wrapper"
        />
        <KsMarkdown
            v-if="inlineHelp && inlineHelpText && !isBoolean"
            class="field-help"
            :content="inlineHelpText"
        />
    </KsFormItem>
</template>

<script setup lang="ts">
    import {computed, inject, ref, useTemplateRef} from "vue"
    import {useI18n} from "vue-i18n"
    import {useBlockComponent} from "./useBlockComponent"
    import {INLINE_TASK_MODE_INJECTION_KEY, BLOCK_SCHEMA_PATH_INJECTION_KEY, FIELD_NAV_INJECTION_KEY, PLUGIN_DEFAULTS_INJECTION_KEY} from "../../injectionKeys"

    import ClearButton from "./ClearButton.vue"
    import {KsMarkdown} from "@kestra-io/design-system"
    import Help from "vue-material-design-icons/Information.vue"
    import TaskLabelWithBoolean from "./TaskLabelWithBoolean.vue"
    import TaskObjectListInline from "../../../plugins/plugin-default/TaskObjectListInline.vue"
    import TaskObjectTaskInline from "../../../plugins/plugin-default/TaskObjectTaskInline.vue"


    const modelValue = defineModel<any>()

    const props = withDefaults(defineProps<{
        schema: any;
        root?: string;
        fieldKey: string;
        task: any;
        required?: string[];
        disabled?: boolean;
        rootOverride?: string;
        frameRoot?: boolean;
    }>(), {frameRoot: false})

    const taskComponent = useTemplateRef<{resetSelectType?: () => void}>("taskComponent")

    const isRequired = computed(() => {
        return !props.disabled && props.required?.includes(props.fieldKey)// && props.schema.$required;
    })

    const hasSelectedASchema = ref(false)


    const componentProps = computed(() => {
        return {
            modelValue: modelValue.value,
            "onUpdate:modelValue": (value: Record<string, any> | string | number | boolean | Array<any>) => {
                modelValue.value = value
            },
            "onUpdate:selectedSchema": (value: any) => {
                hasSelectedASchema.value = value !== undefined
            },
            task: props.task,
            root: props.rootOverride ?? (props.root ? `${props.root}.${props.fieldKey}` : props.fieldKey),
            schema: props.schema,
            required: isRequired.value,
        }
    })

    const hasTooltip = computed(() => {
        return props.schema?.title || props.schema?.description
    })

    const helpText = computed(() => {
        const schema = props.schema
        if (!schema) return ""

        return (
            (schema.title ? "**" + schema.title + "**" : "") +
            (schema.title && schema.description ? "\n" : "") +
            (schema.description ? schema.description : "")
        )
    })

    const isAnyOf = computed(() => {
        return Boolean(props.schema?.anyOf)
    })

    const isBoolean = computed(() => {
        if (simpleType.value === "boolean") return true
        // A boolean is usually declared as anyOf[boolean, string] so it can also
        // hold an expression; render it as a plain switch on the label line too.
        const anyOf = props.schema?.anyOf
        if (!Array.isArray(anyOf) || anyOf.length !== 2) return false
        return anyOf.some(s => s.type === "boolean") && anyOf.some(s => s.type === "string" && !s.format)
    })

    const simpleType = computed(() => {
        return type.value.ksTaskName
    })

    const {getBlockComponent} = useBlockComponent()

    const type = computed(() => {
        return getBlockComponent.value(props.schema ?? {}, props.fieldKey)
    })

    /** Whether the component is rendered in inline mode (used for Plugin Defaults) */
    const inlineMode = inject(INLINE_TASK_MODE_INJECTION_KEY, false)
    const blockSchemaPathInjected = inject(BLOCK_SCHEMA_PATH_INJECTION_KEY, ref(""))

    const {t} = useI18n()

    const pluginDefaults = inject(PLUGIN_DEFAULTS_INJECTION_KEY, undefined)
    const pluginDefault = computed(() => {
        const value = pluginDefaults?.value?.[props.fieldKey]
        return value === undefined || value === null || typeof value === "object" ? undefined : String(value)
    })

    const fieldNav = inject(FIELD_NAV_INJECTION_KEY, undefined)

    const inlineHelp = computed(() => Boolean(fieldNav))
    const inlineHelpText = computed(() => props.schema?.description || props.schema?.title || "")

    const isNestedObject = computed(() =>
        Boolean(props.fieldKey)
        && !inlineMode
        && (simpleType.value === "complex" || simpleType.value === "object"),
    )

    /**
     * Resolves the JSON schema path for the current field.
     * Used by inline components to fetch metadata for nested objects or list items.
     */
    const taskSchemaPath = computed(() => {
        if (props.schema?.items?.$ref) {
            return props.schema.items.$ref
        }

        if (props.schema?.$ref) {
            return props.schema.$ref
        }

        const itemsSuffix = simpleType.value === "list" ? ["items"] : []
        return [blockSchemaPathInjected.value, "properties", props.fieldKey, ...itemsSuffix].join("/")
    })
</script>

<style scoped lang="scss">
.kel-form-item {
    width: 100%;

    > :deep(.kel-form-item__label) {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 0;
    }
}

.field-help {
    margin-top: var(--ks-spacing-1);
    font-size: var(--ks-font-size-sm);
    color: var(--ks-text-muted);
    line-height: 1.45;
    text-wrap: pretty;

    :deep(p) {
        margin: 0;
    }

    :deep(code) {
        font-family: var(--ks-font-family-mono);
        font-size: var(--ks-font-size-xs);
        background: var(--ks-bg-tag-inactive);
        padding: 0 var(--ks-spacing-1);
        border-radius: var(--ks-radius-xs);
    }
}

.inline-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--ks-spacing-2);
    min-width: 0;

    .inline-start {
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        min-width: 0;
        flex: 0 1 auto;
    }

    .label {
        color: var(--ks-text-primary);
        min-width: 0;
        flex: 0 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--ks-font-size-sm);
        font-weight: 600;
    }

    .plugin-default-hint {
        flex-shrink: 0;
        font-size: var(--ks-font-size-xs);
        font-family: var(--ks-font-family-mono);
        color: var(--ks-text-muted);
    }

    .information-icon {
        color: var(--ks-text-secondary);
        cursor: pointer;
    }
}

.type-pill {
    flex-shrink: 0;
    font-size: var(--ks-font-size-xs);
    line-height: 1.5;
    padding: 0 var(--ks-spacing-2);
    border-radius: var(--ks-radius-base);
    background: var(--ks-bg-tag-inactive);
    border: 1px solid var(--ks-border-subtle);
    color: var(--ks-text-secondary);
    text-transform: capitalize;
}

.nested-card {
    border: 1px solid var(--ks-border-subtle);
    border-radius: var(--ks-radius-base);
    background: var(--ks-bg-surface);
    overflow: hidden;
    margin: var(--ks-spacing-1) 0 var(--ks-spacing-2);
}

.nested-card-head {
    display: flex;
    align-items: center;
    gap: var(--ks-spacing-2);
    padding: var(--ks-spacing-2) var(--ks-spacing-3);
    background: var(--ks-bg-elevated);
    border-bottom: 1px solid var(--ks-border-subtle);
}

.nested-card-label {
    font-size: var(--ks-font-size-sm);
    font-weight: 600;
    color: var(--ks-text-primary);
}

.nested-card-body {
    padding: var(--ks-spacing-4) var(--ks-spacing-4) var(--ks-spacing-2);
}
</style>