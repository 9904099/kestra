import {expect, test, type Page} from "@playwright/test"
import {FlowsApi} from "../api/flows.api"
import {fetchFlowSource, login, openBlockEditor, saveFlow, walkTo, waitForMonacoStable} from "./blocks.helpers"

// Editing a task through the dock: every input family of the generated form
// (text via the inline Monaco fields, enum select, segmented String/Array,
// boolean switch, duration presets) plus the raw Source tab — each mutation
// verified against the persisted YAML.
test.describe("Block editor — form editing", () => {
    let flowsApi: FlowsApi
    let flowId: string

    test.beforeEach(async ({page, request, baseURL}) => {
        flowsApi = new FlowsApi(request, baseURL)
        flowId = await flowsApi.generateFlowViaApi("blocks-canvas.yaml", "blocks-canvas-fixture")
        await login(page)
        await openBlockEditor(page, flowId)
    })

    test.afterEach(async () => {
        await flowsApi.removeFlowsViaApi()
    })

    async function openDock(page: Page, id: string) {
        await walkTo(page, id)
        await page.keyboard.press("Enter")
        await expect(page.locator(`[data-dock-pane-id='${id}']`)).toBeVisible()
        await waitForMonacoStable(page)
    }

    // The generated form renders its text fields as inline Monaco editors, so
    // they carry no data-test hooks of their own — the Form pane's field order
    // (id, message for a Log task) is the only stable handle.
    function formMonacoField(page: Page, index: number) {
        return page.locator("[data-dock-pane-id] .task-edit-col-params .monaco-editor:visible").nth(index)
    }

    test("renames the task id from the form and the canvas card follows", async ({page, request, baseURL}) => {
        await openDock(page, "middle_task")

        const idField = formMonacoField(page, 0)
        await idField.click()
        await page.keyboard.press("ControlOrMeta+a")
        await page.keyboard.type("renamed_task")

        await expect(page.locator("[data-block-id='renamed_task']")).toBeVisible()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("id: renamed_task")
        expect(source).not.toContain("id: middle_task")
    })

    test("edits the message field and persists it", async ({page, request, baseURL}) => {
        await openDock(page, "middle_task")

        const messageField = formMonacoField(page, 1)
        await messageField.click()
        await page.keyboard.press("ControlOrMeta+a")
        await page.keyboard.type("changed by e2e")

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("changed by e2e")
    })

    test("switches the message between String and Array with the segmented control", async ({page}) => {
        await openDock(page, "middle_task")
        const pane = page.locator("[data-dock-pane-id='middle_task']")

        // The radio input itself is a zero-size a11y node — its .kel-segmented
        // wrapper label is the visible, clickable surface.
        await pane.getByRole("radio", {name: "Array"}).locator("..").click()
        await expect(pane.getByRole("button", {name: "+ Add a new value"}).first()).toBeVisible()

        await pane.getByRole("radio", {name: "String"}).locator("..").click()
        await expect(pane.getByRole("radio", {name: "String"})).toBeChecked()
    })

    test("selects an enum value and toggles a boolean switch, both persisted", async ({page, request, baseURL}) => {
        await openDock(page, "middle_task")
        const pane = page.locator("[data-dock-pane-id='middle_task']")
        // Scoped to the Form column — the Inputs column has its own "Execution
        // context" section, whose accessible name also matches /Execution/.
        const form = pane.locator(".task-edit-col-params")

        // Enum: the Log task's "level" select, inside the collapsed Logging group
        await form.getByRole("button", {name: /Logging/}).click()
        await form.locator(".kel-select").filter({hasText: "INFO"}).first().click()
        await page.getByRole("option", {name: "DEBUG"}).click()

        // Boolean: the task-level "disabled" switch, inside the Execution group.
        // The role=switch input itself is a zero-size a11y node — the visible,
        // clickable surface is its .kel-switch wrapper.
        await form.getByRole("button", {name: /Execution/}).click()
        await form.getByRole("switch", {name: /disabled/}).locator("..").click()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("level: DEBUG")
        expect(source).toMatch(/disabled: true/)
    })

    test("fills a duration field from its preset buttons", async ({page, request, baseURL}) => {
        await openDock(page, "middle_task")
        const pane = page.locator("[data-dock-pane-id='middle_task']")
        const form = pane.locator(".task-edit-col-params")

        await form.getByRole("button", {name: /Execution/}).click()
        await form.getByRole("button", {name: "30s", exact: true}).first().click()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("PT30S")
    })

    test("edits raw YAML in the Source tab and the canvas syncs", async ({page, request, baseURL}) => {
        await openDock(page, "last_task")
        const pane = page.locator("[data-dock-pane-id='last_task']")

        await pane.getByText("Source", {exact: true}).click()
        await waitForMonacoStable(page, pane)
        const editor = pane.locator(".task-edit-col-params .monaco-editor:visible").first()
        await editor.click()
        await page.keyboard.press("ControlOrMeta+a")
        await page.keyboard.insertText("id: source_edited\ntype: io.kestra.plugin.core.log.Log\nmessage: from source tab")

        // The canvas card renames once the debounced sync lands
        await expect(page.locator("[data-block-id='source_edited']")).toBeVisible()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("id: source_edited")
        expect(source).toContain("from source tab")
    })

    test("editing one open tab never bleeds into another open tab", async ({page, request, baseURL}) => {
        // Regression: the Source tabs of two open tasks used to share one
        // Monaco model, silently overwriting each other.
        await openDock(page, "middle_task")
        await page.locator("[data-block-id='last_task']").click()
        await expect(page.locator("[data-dock-pane-id='last_task']")).toBeVisible()

        const lastPane = page.locator("[data-dock-pane-id='last_task']")
        await lastPane.getByText("Source", {exact: true}).click()
        await waitForMonacoStable(page, lastPane)
        await lastPane.locator(".task-edit-col-params .monaco-editor:visible").first().click()
        await page.keyboard.press("ControlOrMeta+a")
        await page.keyboard.insertText("id: last_task\ntype: io.kestra.plugin.core.log.Log\nmessage: only last changed")

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("only last changed")
        // middle_task is untouched — both its id and original message survive
        expect(source).toContain("id: middle_task")
        expect(source).toContain("message: middle")
    })

    test("two tasks sharing the same id keep distinct focus rings", async ({page}) => {
        // Craft the collision live from the Source tab
        await openDock(page, "last_task")
        const pane = page.locator("[data-dock-pane-id='last_task']")
        await pane.getByText("Source", {exact: true}).click()
        await waitForMonacoStable(page, pane)
        await pane.locator(".task-edit-col-params .monaco-editor:visible").first().click()
        await page.keyboard.press("ControlOrMeta+a")
        await page.keyboard.insertText("id: middle_task\ntype: io.kestra.plugin.core.log.Log\nmessage: duplicate id")

        // Both cards render, disambiguated by 0-based tasks[] index (last_task
        // sits at index 2) — wait for the debounced sync before backing out,
        // or Escape can close the pane before the rename commits
        await expect(page.locator("[data-block-id='middle_task#2']")).toBeVisible()
        await page.keyboard.press("Escape")
        await page.keyboard.press("Escape")

        await expect(page.locator("[data-block-id='middle_task']")).toBeVisible()

        // Focusing one via click rings only that one, not the other
        await page.locator("[data-block-id='middle_task#2']").click()
        await expect(page.locator(".block-kbd-focused")).toHaveCount(1)
    })
})
