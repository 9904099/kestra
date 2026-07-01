import {getType} from "./getTaskComponent"
import {resolve$ref} from "../../../../utils/utils"

const OBJECT_LIKE_TYPES = new Set(["object", "complex"])

function branchesOf(schema: any): any[] {
    return schema?.anyOf ?? schema?.oneOf ?? []
}

/**
 * Whether a resolved schema carries editable object structure once $ref and
 * anyOf/oneOf branches are followed. Used to tell an object (or an array/anyOf
 * of objects) apart from a scalar, enum, or map.
 */
export function looksLikeObject(
    schema: any,
    definitions: Record<string, any>,
    key?: string,
): boolean {
    if (!schema) return false

    const type = getType(schema, definitions, key)
    if (OBJECT_LIKE_TYPES.has(type)) return true

    if (type === "any-of") {
        return branchesOf(schema).some((branch) =>
            looksLikeObject(resolve$ref({definitions}, branch), definitions),
        )
    }

    return false
}

export type ValueSummary =
    | {kind: "empty"}
    | {kind: "count"; count: number}
    | {kind: "text"; text: string};

const MAX_TEXT = 48
const MAX_INLINE_ITEMS = 3

function truncate(text: string): string {
    return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text
}

function afterLastDot(value: string): string {
    const index = value.lastIndexOf(".")
    return index >= 0 ? value.slice(index + 1) : value
}

function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === "object") return Object.keys(value).length === 0
    if (typeof value === "string") return value.trim() === ""
    return false
}

function isScalar(value: any): boolean {
    return value === null || value === undefined || typeof value !== "object"
}

function scalarText(value: any): string {
    if (value === null || value === undefined) return ""
    if (Array.isArray(value)) {
        return value.every(isScalar) ? value.map(String).join(", ") : `${value.length} items`
    }
    if (typeof value === "object") return "…"
    return String(value)
}

/**
 * Structured preview for a drill row. The caller renders `empty` and `count`
 * through i18n (e.g. "Not set", "N items"); `text` is data shown verbatim.
 */
export function summarizeValue(value: any): ValueSummary {
    if (isEmpty(value)) return {kind: "empty"}

    if (Array.isArray(value)) {
        if (value.every(isScalar) && value.length <= MAX_INLINE_ITEMS) {
            return {kind: "text", text: truncate(value.map(String).join(", "))}
        }
        return {kind: "count", count: value.length}
    }

    if (typeof value === "object") {
        const discriminator = value.type ?? value.$type
        const entries = Object.entries(value).filter(([key]) => key !== "type" && key !== "$type")

        if (discriminator) {
            const first = entries[0]
            const tail = first ? ` · ${first[0]}: ${scalarText(first[1])}` : ""
            return {kind: "text", text: truncate(`${afterLastDot(String(discriminator))}${tail}`)}
        }

        const pairs = entries
            .slice(0, MAX_INLINE_ITEMS)
            .map(([key, entryValue]) => `${key}=${scalarText(entryValue)}`)
            .join(", ")
        return {kind: "text", text: truncate(pairs)}
    }

    return {kind: "text", text: truncate(String(value))}
}
