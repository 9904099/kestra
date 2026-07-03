import {onActivated, onDeactivated, onMounted, onUnmounted} from "vue"

const ALWAYS_GLOBAL_IDS = new Set(["save", "undo", "command-menu", "clear"])
const IGNORES_OVERLAY_GUARD_IDS = new Set(["help"])

function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null
    if (!el) return false
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return true
    return Boolean(el.closest?.(".monaco-editor"))
}

function matchesKey(event: KeyboardEvent, key: string): boolean {
    const parts = key.split("+")
    const mainKey = parts[parts.length - 1]
    const needsMeta = parts.includes("Meta") || parts.includes("Control")
    const needsAlt = parts.includes("Alt")
    const needsShift = parts.includes("Shift")
    if (needsMeta && !(event.metaKey || event.ctrlKey)) return false
    if (!needsMeta && (event.metaKey || event.ctrlKey)) return false
    if (needsAlt && !event.altKey) return false
    if (!needsAlt && event.altKey) return false
    // Shift is checked one-way only: a binding that requires it (e.g. Meta+Shift+k)
    // must see shiftKey held, but bindings that don't request it must NOT also reject
    // shiftKey — many single-char bindings (e.g. "?") are themselves shift-produced
    // characters on common layouts, and event.key already disambiguates "k" vs "K".
    if (needsShift && !event.shiftKey) return false
    return event.key.toLowerCase() === mainKey.toLowerCase()
}

export interface BlockEditorKeyBindingLike {
    id: string
    keys: string[]
    alt?: string[]
}

export interface UseBlockEditorKeyboardOptions {
    keymap: BlockEditorKeyBindingLike[]
    // Return false to leave the key's native behavior alone (e.g. Tab when there is no
    // dock panel to focus into) instead of always calling preventDefault(). Returning
    // void/true keeps the existing always-prevent behavior every other binding relies on.
    dispatch: (id: string, event: KeyboardEvent) => void | boolean
    isOverlayOpen?: () => boolean
}

export function resolveBlockEditorBinding(
    event: KeyboardEvent,
    keymap: BlockEditorKeyBindingLike[],
): BlockEditorKeyBindingLike | undefined {
    return keymap.find(binding => [...binding.keys, ...(binding.alt ?? [])].some(key => matchesKey(event, key)))
}

export function useBlockEditorKeyboard(options: UseBlockEditorKeyboardOptions) {
    function handleKeydown(event: KeyboardEvent) {
        const binding = resolveBlockEditorBinding(event, options.keymap)
        if (!binding) return

        const overlayOpen = options.isOverlayOpen?.() ?? false
        const typing = isTypingTarget(event.target)
        const isGlobal = ALWAYS_GLOBAL_IDS.has(binding.id)
        const ignoresOverlayGuard = IGNORES_OVERLAY_GUARD_IDS.has(binding.id)

        if (event.key !== "Escape" && !isGlobal && typing) return
        if (event.key !== "Escape" && !isGlobal && !ignoresOverlayGuard && overlayOpen) return

        const handled = options.dispatch(binding.id, event)
        if (handled !== false) event.preventDefault()
    }

    onMounted(() => window.addEventListener("keydown", handleKeydown))
    onUnmounted(() => window.removeEventListener("keydown", handleKeydown))
    onActivated(() => window.addEventListener("keydown", handleKeydown))
    onDeactivated(() => window.removeEventListener("keydown", handleKeydown))

    return {handleKeydown}
}
