<template>
    <div
        class="task-collection"
        :class="{
            'task-collection--filled': !needWrapper && items.length > 0,
            'task-collection--cards': needWrapper && items.length > 0,
        }"
    >
        <template v-if="needWrapper">
            <div
                v-for="(element, index) in items"
                :key="'array-' + index"
                class="task-array-item"
            >
                <div class="task-array-item-head">
                    <span class="task-array-item-index">{{ index + 1 }}</span>
                    <div class="task-array-item-actions">
                        <KsIconButton
                            v-if="items.length > 1"
                            placement="bottom"
                            :disabled="index === 0"
                            :tooltip="$t('block_editor.move_up')"
                            @click.stop="moveItem(index, 'up')"
                        >
                            <ChevronUp />
                        </KsIconButton>
                        <KsIconButton
                            v-if="items.length > 1"
                            placement="bottom"
                            :disabled="index === items.length - 1"
                            :tooltip="$t('block_editor.move_down')"
                            @click.stop="moveItem(index, 'down')"
                        >
                            <ChevronDown />
                        </KsIconButton>
                        <KsIconButton
                            placement="bottom"
                            :tooltip="$t('block_editor.delete')"
                            @click.stop="removeItem(index)"
                        >
                            <DeleteOutline />
                        </KsIconButton>
                    </div>
                </div>
                <div class="task-array-item-body">
                    <component
                        :is="componentType"
                        :modelValue="element"
                        :task="modelValue"
                        :root="`${root}[${index}]`"
                        :properties="{}"
                        :schema="props.schema.items"
                        @update:model-value="handleInput($event, index)"
                    />
                </div>
            </div>
        </template>

        <template v-else>
            <KsRow
                v-for="(element, index) in items"
                :key="'array-' + index"
                :gutter="10"
                align="top"
                class="w-100"
            >
                <KsCol :span="2" class="d-flex flex-column justify-content-center reorder" v-if="items.length > 1">
                    <ChevronUp
                        @click.prevent.stop="moveItem(index, 'up')"
                        :class="{disabled: index === 0}"
                    />
                    <ChevronDown
                        @click.prevent.stop="moveItem(index, 'down')"
                        :class="{disabled: index === items.length - 1}"
                    />
                </KsCol>
                <KsCol :span="items.length > 1 ? 20 : 22" class="pe-2">
                    <Wrapper merge>
                        <template #tasks>
                            <component
                                :is="componentType"
                                :modelValue="element"
                                :task="modelValue"
                                :root="`${root}[${index}]`"
                                :properties="{}"
                                :schema="props.schema.items"
                                @update:model-value="handleInput($event, index)"
                            />
                        </template>
                    </Wrapper>
                </KsCol>
                <KsCol :span="2" class="delete">
                    <DeleteOutline @click="removeItem(index)" />
                </KsCol>
            </KsRow>
        </template>

        <Add @add="addItem()" />
    </div>
</template>

<script setup lang="ts">
    import {computed, inject, provide, ref, watch} from "vue"

    import {DeleteOutline, ChevronUp, ChevronDown} from "../../utils/icons"

    import Add from "../Add.vue"
    import Wrapper from "./Wrapper.vue"
    import {BLOCK_SCHEMA_PATH_INJECTION_KEY} from "../../injectionKeys"
    import {useBlockComponent} from "./useBlockComponent"

    defineOptions({inheritAttrs: false})

    const blockSchemaPath = inject(BLOCK_SCHEMA_PATH_INJECTION_KEY, ref())

    provide(BLOCK_SCHEMA_PATH_INJECTION_KEY, computed(() => {
        return [blockSchemaPath.value, "properties", props.root, "items"].join("/")
    }))

    const emits = defineEmits(["update:modelValue"])
    const props = withDefaults(defineProps<{
        schema?: any;
        modelValue?: (string | number | boolean | undefined)[] | string | number | boolean;
        required?: boolean;
        root?: string;
    }>(), {
        modelValue: undefined,
        schema: () => ({}),
        required: false,
        root: undefined,
    })

    const {getBlockComponent} = useBlockComponent()

    const componentType = computed(() => {
        return getBlockComponent.value?.(props.schema.items, props.root)
    })

    const needWrapper = computed(() => {
        return ![
            "string",
            "number",
            "boolean",
            "expression",
        ].includes(componentType.value.ksTaskName)
    })

    const items = ref<any[]>([])
    const localEdit = ref(false)

    watch(() => props.modelValue, (value) => {
        if (localEdit.value) {
            localEdit.value = false
            return
        }
        items.value = value === undefined && !props.required
            ? []
            : !Array.isArray(value) ? [value] : [...value]
    }, {immediate: true, deep: true})

    function emitItems(value: any) {
        localEdit.value = true
        emits("update:modelValue", value)
    }

    const handleInput = (value: string, index: number) => {
        items.value.splice(index, 1, value)
        emitItems([...items.value])
    }

    const newEmptyValue = computed(() => {
        if (props.schema.items?.type === "string") {
            return ""
        }
        return props.schema.items?.default ?? undefined
    })

    const addItem = () => {
        items.value.push(newEmptyValue.value)
        emitItems([...items.value])
    }

    const removeItem = (index: number) => {
        const next = [...items.value]
        next.splice(index, 1)
        items.value = next
        emitItems(next.length ? next : undefined)
    }

    const moveItem = (index: number, direction: "up" | "down") => {
        const next = [...items.value]
        if (direction === "up" && index > 0) {
            [next[index - 1], next[index]] = [next[index], next[index - 1]]
        } else if (direction === "down" && index < next.length - 1) {
            [next[index + 1], next[index]] = [next[index], next[index + 1]]
        }
        items.value = next
        emitItems(next)
    }
</script>

<style scoped lang="scss">
@import "../../styles/code.scss";

.disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
}

.task-collection--cards {
    gap: var(--ks-spacing-3);
}

.task-array-item {
    border: 1px solid var(--ks-border-subtle);
    border-radius: var(--ks-radius-base);
    background: var(--ks-bg-surface);
    overflow: hidden;
}

.task-array-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ks-spacing-2);
    padding: var(--ks-spacing-1) var(--ks-spacing-2) var(--ks-spacing-1) var(--ks-spacing-3);
    background: var(--ks-bg-elevated);
    border-bottom: 1px solid var(--ks-border-subtle);
}

.task-array-item-index {
    font-size: var(--ks-font-size-xs);
    font-weight: 600;
    color: var(--ks-text-secondary);
    font-variant-numeric: tabular-nums;
}

.task-array-item-actions {
    display: flex;
    align-items: center;
    gap: var(--ks-spacing-1);
}

.task-array-item-body {
    padding: var(--ks-spacing-4) var(--ks-spacing-4) var(--ks-spacing-2);
}
</style>
