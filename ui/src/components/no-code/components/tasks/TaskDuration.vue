<template>
    <div class="task-duration">
        <KsInput
            :modelValue="text"
            :placeholder="placeholder"
            @update:model-value="onText"
        />
        <span v-if="hint" class="task-duration-hint">{{ hint }}</span>
    </div>
</template>

<script setup lang="ts">
    import {ref, computed, watch} from "vue"
    import {KsInput} from "@kestra-io/design-system"

    const props = defineProps<{modelValue?: string}>()

    const emit = defineEmits<{(e: "update:modelValue", value: string | undefined): void}>()

    const placeholder = "e.g. 30s, 5m, 1h 30m"

    function isoToShorthand(iso?: string): string {
        if (!iso) return ""
        const match = iso.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i)
        if (!match) return iso
        const units: [string | undefined, string][] = [
            [match[1], "w"], [match[2], "d"], [match[3], "h"], [match[4], "m"], [match[5], "s"],
        ]
        const parts = units.filter(([value]) => value).map(([value, unit]) => `${value}${unit}`)
        return parts.length ? parts.join(" ") : iso
    }

    function shorthandToIso(input: string): string | undefined {
        const trimmed = input.trim()
        if (!trimmed) return undefined
        if (/^p/i.test(trimmed)) return trimmed.toUpperCase()

        const totals: Record<string, number> = {w: 0, d: 0, h: 0, m: 0, s: 0}
        let matched = false
        for (const token of trimmed.matchAll(/(\d+)\s*([wdhms])/gi)) {
            matched = true
            totals[token[2].toLowerCase()] += parseInt(token[1], 10)
        }
        if (!matched) return undefined

        let iso = "P"
        if (totals.w) iso += `${totals.w}W`
        if (totals.d) iso += `${totals.d}D`
        if (totals.h || totals.m || totals.s) {
            iso += "T"
            if (totals.h) iso += `${totals.h}H`
            if (totals.m) iso += `${totals.m}M`
            if (totals.s) iso += `${totals.s}S`
        }
        return iso === "P" ? undefined : iso
    }

    const text = ref(isoToShorthand(props.modelValue))

    watch(() => props.modelValue, (value) => {
        if (shorthandToIso(text.value) !== value) {
            text.value = isoToShorthand(value)
        }
    })

    const hint = computed(() => shorthandToIso(text.value) ?? "")

    function onText(value: string | number | undefined) {
        const next = value == null ? "" : String(value)
        text.value = next
        emit("update:modelValue", shorthandToIso(next))
    }
</script>

<style scoped lang="scss">
.task-duration {
    display: flex;
    flex-direction: column;
    gap: var(--ks-spacing-1);
}

.task-duration-hint {
    font-size: var(--ks-font-size-xs);
    font-family: var(--ks-font-family-mono);
    color: var(--ks-text-muted);
}
</style>
