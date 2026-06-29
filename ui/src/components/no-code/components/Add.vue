<template>
    <button @click="emit('add', what)" class="add-value-btn" type="button">
        {{
            what
                ? $t("no_code.adding", {what})
                : $t("no_code.adding_default")
        }}
    </button>
</template>

<script setup lang="ts">
    const emit = defineEmits<{
        (e: "add", what: string | undefined): void;
    }>()

    defineProps<{
        what?: string;
    }>()
</script>

<style scoped lang="scss">
.add-value-btn {
    width: 100%;
    padding: var(--ks-spacing-2);
    background: transparent;
    border: 1px dashed var(--ks-border-default);
    border-radius: var(--ks-radius-base);
    color: var(--ks-text-secondary);
    font-size: var(--ks-font-size-sm);
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s, background-color 0.12s;
}

.add-value-btn:hover {
    border-color: var(--ks-text-link);
    color: var(--ks-text-link);
    background: var(--ks-bg-hover);
}
</style>
