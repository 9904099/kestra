<template>
    <div class="block-insertion-caret" data-test="block-insertion-caret" aria-hidden="true">
        <span class="block-insertion-caret-line" />
        <span class="block-insertion-caret-tag">
            <kbd>A</kbd>
            {{ t("block_editor.insert_here") }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import {useI18n} from "vue-i18n"

    const {t} = useI18n()
</script>

<style scoped lang="scss">
    .block-insertion-caret {
        position: relative;
        height: 0;
        margin: var(--ks-spacing-1) 0;
    }

    .block-insertion-caret-line {
        position: absolute;
        left: 0;
        right: 0;
        top: -1px;
        height: 2px;
        background: var(--ks-text-link);
        border-radius: var(--ks-radius-sm);

        &::before {
            content: "";
            position: absolute;
            left: -4px;
            top: -2.5px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--ks-text-link);
        }
    }

    .block-insertion-caret-tag {
        position: absolute;
        right: 0;
        top: -0.7rem;
        display: inline-flex;
        align-items: center;
        gap: var(--ks-spacing-1);
        font-size: var(--ks-font-size-xs);
        font-weight: 600;
        color: var(--ks-bg-base);
        background: var(--ks-text-link);
        border-radius: var(--ks-radius-lg);
        padding: 1px var(--ks-spacing-2);
    }

    .block-insertion-caret-tag kbd {
        font-family: var(--ks-font-family-mono);
        color: var(--ks-bg-base);
        background: color-mix(in srgb, var(--ks-bg-base) 25%, transparent);
        border-radius: var(--ks-radius-sm);
        padding: 0 var(--ks-spacing-1);
    }
</style>
