<template>
    <div class="block-editor-page" data-test="block-editor-page">
        <BlockEditor />
    </div>
</template>

<script setup lang="ts">
    import {computed, onMounted, provide} from "vue"
    import BlockEditor from "../no-code/blocks/BlockEditor.vue"
    import {useFlowStore} from "../../stores/flow"
    import {usePluginsStore} from "../../stores/plugins"
    import {
        FULL_SOURCE_INJECTION_KEY,
        PARENT_PATH_INJECTION_KEY,
        DEFAULT_NAMESPACE_INJECTION_KEY,
        FULL_SCHEMA_INJECTION_KEY,
        ROOT_SCHEMA_INJECTION_KEY,
        SCHEMA_DEFINITIONS_INJECTION_KEY,
    } from "../no-code/injectionKeys"

    const flowStore = useFlowStore()
    const pluginsStore = usePluginsStore()

    onMounted(() => {
        pluginsStore.lazyLoadSchemaType({type: "flow"})
    })

    provide(FULL_SOURCE_INJECTION_KEY, computed(() => flowStore.flowYaml ?? ""))
    provide(PARENT_PATH_INJECTION_KEY, "tasks")
    provide(DEFAULT_NAMESPACE_INJECTION_KEY, computed(() => flowStore.flow?.namespace ?? "company.team"))
    provide(FULL_SCHEMA_INJECTION_KEY, computed(() => pluginsStore.flowSchema ?? {}))
    provide(ROOT_SCHEMA_INJECTION_KEY, computed(() => pluginsStore.flowRootSchema ?? {}))
    provide(SCHEMA_DEFINITIONS_INJECTION_KEY, computed(() => pluginsStore.flowDefinitions ?? {}))
</script>

<style scoped lang="scss">
    .block-editor-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }
</style>
