<template>
    <div @click="handleClick" class="d-flex align-items-center my-2 p-2 rounded element" :class="{'moved': moved}">
        <div v-if="!['inputs', 'layout'].includes(props.parentPathComplete)" class="icon">
            <TaskIcon v-if="!isPlaceholder" :cls="element.type" :loadIcon="pluginsStore.loadIcon" onlyIcon />
            <PlusBoxOutline v-else class="placeholder-icon" />
        </div>

        <div class="flex-grow-1 body" :class="{placeholder: isPlaceholder}">
            <span class="label">{{ mainLabel }}</span>
            <span v-if="showType" class="type">{{ typeLabel }}</span>
        </div>

        <div v-if="!isPlaceholder" class="actions">
            <KsIconButton
                v-if="playgroundStore.enabled && element.id && isTask"
                :tooltip="t('playground.run_task')"
                type="primary"
                @click.prevent.stop="playgroundStore.runUntilTask(element.id)"
            >
                <PlayIcon />
            </KsIconButton>
            <template v-if="elementIndex !== undefined">
                <KsIconButton :tooltip="t('block_editor.move_up')" @click.prevent.stop="emits('moveElement', 'up')">
                    <ChevronUp />
                </KsIconButton>
                <KsIconButton :tooltip="t('block_editor.move_down')" @click.prevent.stop="emits('moveElement', 'down')">
                    <ChevronDown />
                </KsIconButton>
            </template>
            <KsIconButton class="delete-action" :tooltip="t('delete')" @click.prevent.stop="emits('removeElement')">
                <DeleteOutline class="delete-icon" />
            </KsIconButton>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {computed, inject} from "vue"
    import {useI18n} from "vue-i18n"
    import PlayIcon from "vue-material-design-icons/Play.vue"
    import PlusBoxOutline from "vue-material-design-icons/PlusBoxOutline.vue"
    import {usePluginsStore} from "../../../../../stores/plugins"
    import {usePlaygroundStore} from "../../../../../stores/playground"


    import {capitalCase} from "change-case"
    import {DeleteOutline, ChevronUp, ChevronDown} from "../../../utils/icons"
    import {
        EDIT_TASK_FUNCTION_INJECTION_KEY,
    } from "../../../injectionKeys"

    import TaskIcon from "../../../../plugins/TaskIcon.vue"
    import {KsIconButton} from "@kestra-io/design-system"

    const emits = defineEmits(["removeElement", "moveElement"])

    const {t} = useI18n()

    const props = defineProps<{
        section: string;
        parentPathComplete: string;
        element: {
            id?: string;
            type?: string;
            on?: string;
        };
        blockSchemaPath: string;
        elementIndex?: number;
        typeFieldSchema: "on" | "type";
        moved?: boolean;
        title?: string
    }>()

    const pluginsStore = usePluginsStore()
    const playgroundStore = usePlaygroundStore()

    const isTask = computed(() => ["tasks", "task"].includes(props.parentPathComplete.split(".").pop() ?? "not-found"))

    const editTask = inject(EDIT_TASK_FUNCTION_INJECTION_KEY, () => {})

    const elementValue = computed(() => props.element[props.typeFieldSchema])

    const identifier = computed(() => {
        return props.element.id
            ?? props.element[props.typeFieldSchema]
            ?? `<${t("no_code.unnamed")} ${props.elementIndex}>`
    })

    const isPlaceholder = computed(() => !elementValue.value && props.elementIndex === undefined)

    const placeholderLabel = computed(() => {
        const field = props.parentPathComplete.split(".").pop()?.replace(/\[\d+\]$/, "") ?? ""
        const human = /^\d*$/.test(field) ? "" : capitalCase(field)
        return human ? t("no_code.add_field", {field: human}) : t("add")
    })

    const mainLabel = computed(() => isPlaceholder.value ? placeholderLabel.value : (props.title ?? identifier.value))

    const typeLabel = computed(() => {
        const value = elementValue.value
        return typeof value === "string" ? value.split(".").pop() : undefined
    })

    const showType = computed(() => !isPlaceholder.value && !!typeLabel.value && typeLabel.value !== mainLabel.value)

    const handleClick = () => {
        editTask(
            props.parentPathComplete,
            props.blockSchemaPath,
            props.elementIndex,
        )
    }
</script>

<style scoped lang="scss">
@import "../../../styles/code.scss";

.element {
    cursor: pointer;
    gap: var(--ks-spacing-2);
    background-color: $code-card-color;
    border: 1px solid $code-border-color;
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

    &:hover {
        background-color: var(--ks-btn-secondary-bg-hover);
    }

    & > .icon {
        flex: 0 0 auto;
        width: 1.75rem;
        height: 1.75rem;
        display: flex;
        align-items: center;
        justify-content: center;

        .placeholder-icon {
            display: inline-flex;
            font-size: var(--ks-font-size-xl);
            color: var(--ks-text-link);
        }
    }

    & > .body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.25;

        .label {
            color: inherit;
            font-size: $code-font-sm;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .type {
            color: var(--ks-text-secondary);
            font-size: var(--ks-font-size-xs);
        }

        &.placeholder .label {
            color: var(--ks-text-link);
        }
    }

    &.moved {
        background-color: var(--ks-btn-secondary-bg-active);
        border-color: var(--ks-border-focus);
    }

    .actions {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease-in-out;
    }

    &:hover .actions,
    &:focus-within .actions {
        opacity: 1;
        pointer-events: auto;
    }

    .delete-action:hover .delete-icon {
        color: var(--ks-text-error);
    }
}
</style>
