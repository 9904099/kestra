import {ref, computed} from "vue"

export interface NavFrame {
    /** Dot path of the field inside the task model, e.g. "retry" or "batch.options". */
    path: string;
    /** Display label shown in the breadcrumb (the field key). */
    label: string;
    /** The `root` prop the field was rendered with, reused to re-render it. */
    root: string;
    /** The field key. */
    fieldKey: string;
    /** The field schema. */
    schema: any;
}

/**
 * Per-pane push-in-place navigation stack for the no-code task form. Drilling
 * into a deep field (object, array of objects, complex anyOf) pushes a frame;
 * the form then renders that frame full-width with a breadcrumb back.
 */
export function useFieldNavigation() {
    const stack = ref<NavFrame[]>([])

    const current = computed<NavFrame | undefined>(() => stack.value[stack.value.length - 1])

    function push(frame: NavFrame) {
        stack.value = [...stack.value, frame]
    }

    function pop() {
        stack.value = stack.value.slice(0, -1)
    }

    function popTo(index: number) {
        stack.value = stack.value.slice(0, index + 1)
    }

    function reset() {
        if (stack.value.length) stack.value = []
    }

    return {stack, current, push, pop, popTo, reset}
}

export type FieldNavigation = ReturnType<typeof useFieldNavigation>;
