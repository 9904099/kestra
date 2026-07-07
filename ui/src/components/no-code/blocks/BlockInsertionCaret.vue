<template>
    <div
        class="block-insertion-caret"
        :class="`block-insertion-caret--${position}`"
        data-test="block-insertion-caret"
        aria-hidden="true"
    >
        <span class="block-insertion-caret-tag">
            <kbd>{{ position === "before" ? "⇧A" : "A" }}</kbd>
        </span>
    </div>
</template>

<script setup lang="ts">
    withDefaults(defineProps<{
        position?: "before" | "after"
    }>(), {
        position: "after",
    })
</script>

<style scoped lang="scss">
    .block-insertion-caret {
        position: relative;
        height: 0;
        margin: var(--ks-spacing-1) 0;
    }

    .block-insertion-caret-tag {
        position: absolute;
        right: 0;
        display: inline-flex;
        align-items: center;
        font-size: var(--ks-font-size-xs);
        font-weight: 500;
        color: var(--ks-text-link);
        background: var(--ks-bg-elevated);
        border: 1px solid var(--ks-border-subtle);
        border-radius: var(--ks-radius-lg);
        padding: 1px var(--ks-spacing-2);
    }

    .block-insertion-caret--after .block-insertion-caret-tag {
        top: -0.7rem;
    }

    .block-insertion-caret--before .block-insertion-caret-tag {
        bottom: -0.7rem;
    }

    .block-insertion-caret-tag kbd {
        font-family: var(--ks-font-family-mono);
        color: var(--ks-text-link);
        background: var(--ks-bg-tag);
        border-radius: var(--ks-radius-sm);
        padding: 0 var(--ks-spacing-1);
    }
</style>
