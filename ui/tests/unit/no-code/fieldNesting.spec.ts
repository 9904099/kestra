import {describe, it, expect} from "vitest"
import {
    isDrillableField,
    looksLikeObject,
    summarizeValue,
} from "../../../src/components/no-code/components/tasks/fieldNesting"

const definitions = {
    Foo: {type: "object", properties: {a: {type: "string"}}},
}

describe("isDrillableField", () => {
    it("keeps scalars inline", () => {
        expect(isDrillableField({type: "string"}, {})).toBe(false)
        expect(isDrillableField({type: "boolean"}, {})).toBe(false)
        expect(isDrillableField({type: "integer"}, {})).toBe(false)
        expect(isDrillableField({enum: ["A", "B"]}, {})).toBe(false)
    })

    it("keeps maps inline", () => {
        expect(isDrillableField({type: "object", additionalProperties: {type: "string"}}, {})).toBe(false)
    })

    it("keeps arrays of primitives inline", () => {
        expect(isDrillableField({type: "array", items: {type: "string"}}, {})).toBe(false)
    })

    it("keeps a scalar anyOf inline", () => {
        expect(isDrillableField({anyOf: [{type: "string"}, {type: "integer"}]}, {})).toBe(false)
    })

    it("drills an object with properties", () => {
        expect(isDrillableField({type: "object", properties: {a: {type: "string"}}}, {})).toBe(true)
    })

    it("drills a complex $ref", () => {
        expect(isDrillableField({$ref: "#/definitions/Foo"}, definitions)).toBe(true)
    })

    it("drills an array of inline objects", () => {
        expect(isDrillableField({type: "array", items: {type: "object", properties: {a: {}}}}, {})).toBe(true)
    })

    it("drills an array of $ref objects", () => {
        expect(isDrillableField({type: "array", items: {$ref: "#/definitions/Foo"}}, definitions)).toBe(true)
    })

    it("drills an anyOf with an object branch", () => {
        expect(isDrillableField({anyOf: [{type: "string"}, {type: "object", properties: {a: {}}}]}, {})).toBe(true)
        expect(isDrillableField({anyOf: [{type: "string"}, {$ref: "#/definitions/Foo"}]}, definitions)).toBe(true)
    })

    it("never drills a big-anyOf list (block canvas territory)", () => {
        const items = {anyOf: Array.from({length: 11}, () => ({$ref: "#/definitions/Foo"}))}
        expect(isDrillableField({type: "array", items}, definitions)).toBe(false)
    })

    it("never drills a task", () => {
        expect(isDrillableField({$ref: "#/definitions/io.kestra.core.models.tasks.Task"}, {})).toBe(false)
    })

    it("forces inline in plugin-defaults inlineMode", () => {
        expect(isDrillableField({type: "object", properties: {a: {}}}, {}, undefined, {inlineMode: true})).toBe(false)
    })

    it("handles missing schema", () => {
        expect(isDrillableField(undefined, {})).toBe(false)
    })
})

describe("looksLikeObject", () => {
    it("is true for object / complex / object-anyOf", () => {
        expect(looksLikeObject({type: "object", properties: {a: {}}}, {})).toBe(true)
        expect(looksLikeObject({$ref: "#/definitions/Foo"}, definitions)).toBe(true)
        expect(looksLikeObject({anyOf: [{type: "string"}, {$ref: "#/definitions/Foo"}]}, definitions)).toBe(true)
    })

    it("is false for scalars, maps and scalar anyOf", () => {
        expect(looksLikeObject({type: "string"}, {})).toBe(false)
        expect(looksLikeObject({type: "object", additionalProperties: {}}, {})).toBe(false)
        expect(looksLikeObject({anyOf: [{type: "string"}, {type: "integer"}]}, {})).toBe(false)
    })
})

describe("summarizeValue", () => {
    it("reports empty", () => {
        expect(summarizeValue(null)).toEqual({kind: "empty"})
        expect(summarizeValue(undefined)).toEqual({kind: "empty"})
        expect(summarizeValue([])).toEqual({kind: "empty"})
        expect(summarizeValue({})).toEqual({kind: "empty"})
        expect(summarizeValue("  ")).toEqual({kind: "empty"})
    })

    it("joins a short primitive array", () => {
        expect(summarizeValue(["FR", "US", "JP"])).toEqual({kind: "text", text: "FR, US, JP"})
    })

    it("counts a long or object array", () => {
        expect(summarizeValue(["a", "b", "c", "d"])).toEqual({kind: "count", count: 4})
        expect(summarizeValue([{}, {}])).toEqual({kind: "count", count: 2})
    })

    it("shows a map as key=value pairs", () => {
        expect(summarizeValue({env: "prod", team: "data"})).toEqual({kind: "text", text: "env=prod, team=data"})
    })

    it("leads a discriminated object with its type", () => {
        expect(summarizeValue({type: "ExecutionStatus", in: ["SUCCESS", "WARNING"]}))
            .toEqual({kind: "text", text: "ExecutionStatus · in: SUCCESS, WARNING"})
    })

    it("shortens a fully-qualified discriminator", () => {
        const value = {type: "io.kestra.core.models.conditions.types.ExecutionStatusCondition", in: ["SUCCESS"]}
        expect(summarizeValue(value)).toEqual({kind: "text", text: "ExecutionStatusCondition · in: SUCCESS"})
    })

    it("keeps scalars verbatim, including falsy ones", () => {
        expect(summarizeValue("hello")).toEqual({kind: "text", text: "hello"})
        expect(summarizeValue(0)).toEqual({kind: "text", text: "0"})
        expect(summarizeValue(false)).toEqual({kind: "text", text: "false"})
    })

    it("truncates long text", () => {
        const long = "x".repeat(80)
        const result = summarizeValue(long)
        expect(result.kind).toBe("text")
        expect((result as {text: string}).text.endsWith("…")).toBe(true)
        expect((result as {text: string}).text.length).toBeLessThanOrEqual(48)
    })
})
