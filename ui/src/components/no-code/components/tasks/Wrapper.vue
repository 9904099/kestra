<template>
    <slot v-if="transparent" name="tasks" />
    <div v-else class="schema-wrapper" :class="{bordered: !merge}">
        <slot name="tasks" />
    </div>
</template>

<script setup lang="ts">
    defineOptions({name: "Wrapper"})

    defineProps<{merge?: boolean, transparent?: boolean}>()
</script>

<style scoped lang="scss">
.schema-wrapper {
    width: 100%;
    padding-bottom: var(--ks-spacing-4);
    border-radius: var(--ks-radius-base);
}
.bordered {
    background: var(--ks-bg-surface);
    border: 1px solid var(--ks-border-subtle);
    border-radius: var(--ks-radius-lg);
    margin: var(--ks-spacing-3) 0;
    padding: var(--ks-spacing-4) var(--ks-spacing-5);
    transition: border-color 0.12s;
}
.bordered:focus-within {
    border-color: var(--ks-border-default);
}
</style>
