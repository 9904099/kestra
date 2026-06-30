<template>
    <div class="task-duration">
        <div class="task-duration-rows">
            <div
                v-for="(segment, index) in segments"
                :key="index"
                class="task-duration-row"
            >
                <KsInputNumber
                    :modelValue="segment.value"
                    :min="0"
                    :controls="false"
                    placeholder="0"
                    class="task-duration-value"
                    @update:model-value="(value) => onValue(index, value)"
                />
                <KsSelect
                    :modelValue="segment.unit"
                    class="task-duration-unit"
                    @update:model-value="(value) => onUnit(index, String(value))"
                >
                    <KsOption
                        v-for="unit in availableUnits(index)"
                        :key="unit.key"
                        :value="unit.key"
                        :label="$t(`no_code.duration.units.${unit.label}`)"
                    />
                </KsSelect>
                <KsIconButton
                    v-if="segments.length > 1"
                    :tooltip="$t('delete')"
                    @click="removeSegment(index)"
                >
                    <Close />
                </KsIconButton>
            </div>
        </div>

        <button
            v-if="segments.length < UNITS.length"
            type="button"
            class="task-duration-add"
            @click="addSegment"
        >
            <Plus :size="16" />
            {{ $t("no_code.duration.add_unit") }}
        </button>

        <div class="task-duration-presets">
            <button
                v-for="preset in PRESETS"
                :key="preset.label"
                type="button"
                class="task-duration-preset"
                :class="{active: isActivePreset(preset)}"
                @click="applyPreset(preset)"
            >
                {{ preset.label }}
            </button>
        </div>

        <div v-if="iso" class="task-duration-preview">
            <ClockOutline :size="14" />
            <code>{{ iso }}</code>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {ref, computed, watch} from "vue"
    import Close from "vue-material-design-icons/Close.vue"
    import Plus from "vue-material-design-icons/Plus.vue"
    import ClockOutline from "vue-material-design-icons/ClockOutline.vue"

    interface Segment {
        value: number | null;
        unit: string;
    }

    const UNITS = [
        {key: "w", label: "week", iso: "W"},
        {key: "d", label: "day", iso: "D"},
        {key: "h", label: "hour", iso: "H"},
        {key: "m", label: "minute", iso: "M"},
        {key: "s", label: "second", iso: "S"},
    ] as const

    const PRESETS = [
        {label: "30s", value: 30, unit: "s"},
        {label: "1m", value: 1, unit: "m"},
        {label: "5m", value: 5, unit: "m"},
        {label: "15m", value: 15, unit: "m"},
        {label: "1h", value: 1, unit: "h"},
        {label: "6h", value: 6, unit: "h"},
        {label: "1d", value: 1, unit: "d"},
    ]

    const props = defineProps<{modelValue?: string}>()

    const emit = defineEmits<{(e: "update:modelValue", value: string | undefined): void}>()

    const segments = ref<Segment[]>([])
    const localEdit = ref(false)

    function parse(value?: string): Segment[] {
        const match = value?.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i)
        if (!match) return [{value: null, unit: "m"}]
        const units: [string | undefined, string][] = [
            [match[1], "w"], [match[2], "d"], [match[3], "h"], [match[4], "m"], [match[5], "s"],
        ]
        const parsed = units
            .filter(([raw]) => raw !== undefined)
            .map(([raw, unit]) => ({value: parseInt(raw as string, 10), unit}))
        return parsed.length ? parsed : [{value: null, unit: "m"}]
    }

    watch(() => props.modelValue, (value) => {
        if (localEdit.value) {
            localEdit.value = false
            return
        }
        segments.value = parse(value)
    }, {immediate: true})

    function build(input: Segment[]): string | undefined {
        const totals: Record<string, number> = {w: 0, d: 0, h: 0, m: 0, s: 0}
        for (const segment of input) {
            if (segment.value && segment.value > 0) {
                totals[segment.unit] += Math.round(segment.value)
            }
        }
        let date = ""
        if (totals.w) date += `${totals.w}W`
        if (totals.d) date += `${totals.d}D`
        let time = ""
        if (totals.h) time += `${totals.h}H`
        if (totals.m) time += `${totals.m}M`
        if (totals.s) time += `${totals.s}S`
        if (!date && !time) return undefined
        return `P${date}${time ? `T${time}` : ""}`
    }

    const iso = computed(() => build(segments.value))

    function emitChange() {
        localEdit.value = true
        emit("update:modelValue", build(segments.value))
    }

    function onValue(index: number, value: number | null | undefined) {
        segments.value[index].value = value == null ? null : Number(value)
        emitChange()
    }

    function onUnit(index: number, unit: string) {
        segments.value[index].unit = unit
        emitChange()
    }

    function availableUnits(index: number) {
        const usedByOthers = new Set(
            segments.value.filter((_, position) => position !== index).map((segment) => segment.unit),
        )
        return UNITS.filter((unit) => !usedByOthers.has(unit.key))
    }

    function addSegment() {
        const used = new Set(segments.value.map((segment) => segment.unit))
        const next = UNITS.find((unit) => !used.has(unit.key))?.key ?? "s"
        segments.value.push({value: null, unit: next})
    }

    function removeSegment(index: number) {
        segments.value.splice(index, 1)
        emitChange()
    }

    function applyPreset(preset: {value: number; unit: string}) {
        segments.value = [{value: preset.value, unit: preset.unit}]
        emitChange()
    }

    function isActivePreset(preset: {value: number; unit: string}) {
        return segments.value.length === 1
            && segments.value[0].value === preset.value
            && segments.value[0].unit === preset.unit
    }
</script>

<style scoped lang="scss">
.task-duration {
    display: flex;
    flex-direction: column;
    gap: var(--ks-spacing-3);
}

.task-duration-rows {
    display: flex;
    flex-direction: column;
    gap: var(--ks-spacing-2);
}

.task-duration-row {
    display: flex;
    align-items: center;
    gap: var(--ks-spacing-2);
}

.task-duration-value {
    width: 7rem;
}

.task-duration-unit {
    flex: 1;
    max-width: 12rem;
}

.task-duration-add {
    display: inline-flex;
    align-items: center;
    gap: var(--ks-spacing-1);
    align-self: flex-start;
    padding: var(--ks-spacing-1) var(--ks-spacing-2);
    background: transparent;
    border: 1px dashed var(--ks-border-default);
    border-radius: var(--ks-radius-base);
    color: var(--ks-text-secondary);
    font-size: var(--ks-font-size-sm);
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
}

.task-duration-add:hover {
    border-color: var(--ks-text-link);
    color: var(--ks-text-link);
}

.task-duration-presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ks-spacing-1);
}

.task-duration-preset {
    padding: 2px var(--ks-spacing-2);
    background: var(--ks-bg-tag-inactive);
    border: 1px solid var(--ks-border-subtle);
    border-radius: var(--ks-radius-base);
    color: var(--ks-text-secondary);
    font-family: var(--ks-font-family-mono);
    font-size: var(--ks-font-size-xs);
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
}

.task-duration-preset:hover {
    border-color: var(--ks-border-default);
    color: var(--ks-text-primary);
}

.task-duration-preset.active {
    border-color: var(--ks-text-link);
    color: var(--ks-text-link);
}

.task-duration-preview {
    display: flex;
    align-items: center;
    gap: var(--ks-spacing-1);
    color: var(--ks-text-muted);
    font-size: var(--ks-font-size-xs);
}

.task-duration-preview code {
    font-family: var(--ks-font-family-mono);
    color: var(--ks-text-secondary);
}
</style>
