<template>
    <div
        class="block-card"
        :class="{'block-card--selected': selected, 'block-card--drag-over': dragOver}"
        role="button"
        tabindex="0"
        :aria-pressed="selected"
        :aria-label="cardAriaLabel"
        :draggable="draggable"
        data-test="block-card"
        @click="emit('select')"
        @keydown.enter.prevent="emit('select')"
        @keydown.space.prevent="emit('select')"
        @dragstart="emit('drag-start', $event)"
        @dragover.prevent="emit('drag-over', $event)"
        @drop.prevent="emit('drop', $event)"
        @dragend="emit('drag-end')"
    >
        <DragVertical
            v-if="draggable"
            class="block-card-grip"
            :aria-label="t('block_editor.drag_reorder')"
            @mousedown.stop
        />

        <KsTaskIcon
            class="block-card-ico"
            :cls="String(block.type ?? '')"
            :icons="icons"
            :onlyIcon="true"
        />

        <div class="block-card-main">
            <span class="block-card-id" data-test="block-card-id">{{ block.id }}</span>
            <span class="block-card-type" data-test="block-card-type">{{ shortType }}</span>
        </div>

        <div class="block-card-actions">
            <KsIconButton
                class="block-card-action"
                :aria-label="t('block_editor.duplicate')"
                :tooltip="t('block_editor.duplicate')"
                data-test="block-card-duplicate"
                @click.stop="emit('duplicate')"
            >
                <ContentCopy />
            </KsIconButton>

            <KsIconButton
                class="block-card-action block-card-action--danger"
                :aria-label="t('block_editor.delete')"
                :tooltip="t('block_editor.delete')"
                data-test="block-card-delete"
                @click.stop="emit('delete')"
            >
                <DeleteOutline />
            </KsIconButton>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {computed} from "vue"
    import {useI18n} from "vue-i18n"
    import ContentCopy from "vue-material-design-icons/ContentCopy.vue"
    import DeleteOutline from "vue-material-design-icons/DeleteOutline.vue"
    import DragVertical from "vue-material-design-icons/DragVertical.vue"

    import {KsTaskIcon, KsIconButton} from "@kestra-io/design-system"

    const {t} = useI18n()

    const props = defineProps<{
        block: Record<string, unknown>
        selected?: boolean
        draggable?: boolean
        dragOver?: boolean
        icons?: Record<string, {icon: string; flowable: boolean}>
    }>()

    const emit = defineEmits<{
        (e: "select"): void
        (e: "delete"): void
        (e: "duplicate"): void
        (e: "drag-start", event: DragEvent): void
        (e: "drag-over", event: DragEvent): void
        (e: "drop", event: DragEvent): void
        (e: "drag-end"): void
    }>()

    const shortType = computed(() => {
        const type = String(props.block.type ?? "")
        const parts = type.split(".")
        return parts[parts.length - 1] ?? type
    })

    const cardAriaLabel = computed(() =>
        t("block_editor.card_aria_label", {id: String(props.block.id ?? ""), type: shortType.value}),
    )
</script>

<style scoped lang="scss">
    .block-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-3);
        padding: var(--ks-spacing-2) var(--ks-spacing-3);
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-base);
        background: var(--ks-bg-base);
        cursor: pointer;
        transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
        outline: none;

        &:hover {
            background: var(--ks-bg-surface);
            border-color: var(--ks-border-strong);
            box-shadow: var(--ks-shadow-sm);
        }

        &:focus-visible {
            border-color: var(--ks-border-focus);
            box-shadow: 0 0 0 2px var(--ks-border-focus);
        }

        &--selected {
            border-color: var(--ks-border-focus);
            background: var(--ks-bg-active);
        }

        &--drag-over {
            border-color: var(--ks-text-link);
            border-style: dashed;
        }
    }

    .block-card-grip {
        flex-shrink: 0;
        color: var(--ks-icon-inactive);
        cursor: grab;
        display: flex;
        font-size: var(--ks-font-size-sm);
        opacity: 0;
        transition: opacity 0.15s;

        .block-card:hover & {
            opacity: 1;
        }

        &:active {
            cursor: grabbing;
        }
    }

    .block-card-ico {
        flex-shrink: 0;
        width: var(--ks-icon-size-lg);
        height: var(--ks-icon-size-lg);
    }

    .block-card-main {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
        gap: 1px;
    }

    .block-card-id {
        font-size: var(--ks-font-size-sm);
        font-weight: 600;
        font-family: var(--ks-font-family-mono);
        color: var(--ks-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-card-type {
        font-size: var(--ks-font-size-xs);
        color: var(--ks-text-muted);
        font-family: var(--ks-font-family-mono);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .block-card-actions {
        position: absolute;
        right: var(--ks-spacing-3);
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        padding-left: var(--ks-spacing-3);
        background: var(--ks-bg-hover);
        border-radius: var(--ks-radius-base);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;

        .block-card:hover &,
        .block-card:focus-within & {
            opacity: 1;
            pointer-events: auto;
        }
    }

    .block-card-action {
        &--danger:hover {
            color: var(--ks-text-error);
        }
    }

    .block-kbd-focused {
        box-shadow: 0 0 0 2px var(--ks-border-focus);
    }
</style>
