<template>
    <div class="task-collection" :class="{'task-collection--filled': items.length > 0}">
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
                <Wrapper :merge="!needWrapper">
                    <template #tasks>
                        <component
                            :key="'array-' + index"
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
</style>
