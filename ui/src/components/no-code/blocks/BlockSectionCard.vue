<template>
    <section class="block-section" :class="`block-section--${tone}`" :data-test="`block-section-${name}`">
        <header class="block-section-head">
            <div class="block-section-title">
                <component :is="icon" class="block-section-ico" />
                <span>{{ title }}</span>
                <span class="block-section-count">{{ count }}</span>
            </div>

            <button
                class="block-section-add"
                type="button"
                :data-test="addTest"
                :aria-label="addLabel"
                @click="emit('add', $event)"
            >
                <Plus class="block-section-add-ico" />
                {{ addLabel }}
            </button>
        </header>

        <div class="block-section-body">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
    import type {Component} from "vue"
    import Plus from "vue-material-design-icons/Plus.vue"

    withDefaults(defineProps<{
        name: string
        title: string
        icon: Component
        count: number
        addLabel: string
        tone?: "default" | "error" | "warning"
        addTest?: string
    }>(), {
        tone: "default",
    })

    const emit = defineEmits<{
        (e: "add", evt: MouseEvent): void
    }>()
</script>

<style scoped lang="scss">
    .block-section {
        background: var(--ks-bg-surface);
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-lg);
        overflow: hidden;
    }

    .block-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ks-spacing-2);
        padding: var(--ks-spacing-3) var(--ks-spacing-4);
        border-bottom: 1px solid var(--ks-border-subtle);
    }

    .block-section-title {
        display: flex;
        align-items: center;
        gap: var(--ks-spacing-2);
        font-size: var(--ks-font-size-base);
        font-weight: 600;
        color: var(--ks-text-primary);
    }

    .block-section-ico {
        display: flex;
        font-size: var(--ks-font-size-base);
        color: var(--ks-text-secondary);

        .block-section--error & {
            color: var(--ks-text-error);
        }

        .block-section--warning & {
            color: var(--ks-text-warning);
        }
    }

    .block-section-count {
        font-size: var(--ks-font-size-xs);
        font-weight: 600;
        font-family: var(--ks-font-family-mono);
        padding: 0 var(--ks-spacing-2);
        border-radius: var(--ks-radius-lg);
        background: var(--ks-bg-tag-hover);
        color: var(--ks-text-link);

        .block-section--error & {
            background: var(--ks-bg-error);
            color: var(--ks-text-error);
        }

        .block-section--warning & {
            background: var(--ks-bg-warning);
            color: var(--ks-text-warning);
        }
    }

    .block-section-add {
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        flex-shrink: 0;
        font-size: var(--ks-font-size-sm);
        font-weight: 500;
        color: var(--ks-text-secondary);
        background: transparent;
        border: 1px solid var(--ks-border-default);
        border-radius: var(--ks-radius-base);
        padding: var(--ks-spacing-1) var(--ks-spacing-3);
        cursor: pointer;
        transition: color 0.12s, border-color 0.12s, background-color 0.12s;

        &:hover {
            color: var(--ks-text-link);
            border-color: var(--ks-text-link);
            background: var(--ks-bg-tag-hover);
        }
    }

    .block-section-add-ico {
        display: flex;
        font-size: var(--ks-font-size-sm);
    }

    .block-section-body {
        display: flex;
        flex-direction: column;
        gap: var(--ks-spacing-2);
        padding: var(--ks-spacing-3);
    }
</style>
