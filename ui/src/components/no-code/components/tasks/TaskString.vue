<template>
    <div class="wrapper">
        <KsCheckboxButton
            v-if="['duration', 'date-time'].includes(schema?.format ?? '')"
            v-model="pebble"
            :title="$t('no_code.toggle_pebble')"
            :aria-label="$t('no_code.toggle_pebble')"
            class="ks-pebble"
        >
            <IconCodeBracesBox />
        </KsCheckboxButton>

        <KsDatePicker
            v-if="!pebble && schema?.format === 'date-time'"
            :modelValue="modelValue"
            type="date"
            :placeholder="`Choose a${/^[aeiou]/i.test(root || '') ? 'n' : ''} ${root || 'date'}`"
            @update:model-value="(v: Date | string | null) => onInput(v instanceof Date ? v.toISOString() : '')"
        />
        <KsDurationPicker
            v-if="!pebble && schema?.format === 'duration'"
            :modelValue="modelValue"
            class="duration-field"
            @update:model-value="onInput"
        />
        <InputText
            v-if="disabled"
            :modelValue="modelValue"
            disabled
            class="w-100 disabled-field"
        />
        <KsEditor
            v-else-if="pebble || !schema?.format"
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
    </div>
</template>
<script lang="ts" setup>
    import {ref, computed, onMounted} from "vue"
    import $moment from "moment"
    import IconCodeBracesBox from "vue-material-design-icons/CodeBracesBox.vue"
    import {KsEditor} from "@kestra-io/design-system"
    import {useEditorBindings} from "../../../../composables/useEditorBindings"
    import InputText from "../inputs/InputText.vue"
    import {Schema} from "./getTaskComponent"

    defineOptions({inheritAttrs: false})

    const editorBindings = useEditorBindings()

    const props = defineProps<{
        disabled?: boolean;
        modelValue?: string;
        schema?: Schema;
        root?: string;
        task?: any;
    }>()

    const emit = defineEmits<{
        (e: "update:modelValue", value: string | undefined): void;
    }>()


    const pebble = ref(false)

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

        if (!["duration", "date-time"].includes(schema.format ?? "") || !props.modelValue) {
            pebble.value = false
        } else if (schema.format === "duration" && values.value) {
            pebble.value = !$moment.duration(props.modelValue).isValid()
        } else if (schema.format === "date-time" && values.value) {
            pebble.value = isNaN(Date.parse(props.modelValue as string))
        }
    })

    function onInput(value: string | null | undefined) {
        emit("update:modelValue", value ?? undefined)
    }

    const editorValue = computed(() => props.modelValue)

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
    width: 100%;

    :deep(.disabled-field) {
        margin: 0!important;
        border-radius: 4px;
    }

    :deep(.kel-input__wrapper),
    :deep(.editor-container) {
        box-shadow: none;
    }

    :deep(.ks-editor){
        flex: 1;
    }

    :deep(.kel-checkbox-button__inner) {
        padding: 4px;
        border: none;
    }

    .ks-pebble:deep(span:hover){
        color: var(--ks-text-link) ;
    }

    .ks-pebble * {
        font-size: var(--ks-font-size-xl);
        vertical-align: top;
    }
}

.duration-unit{
    color: var(--ks-text-inactive);
    font-size: var(--ks-font-size-sm);
    line-height: 1.25rem;
    background-color: transparent;
}

</style>
