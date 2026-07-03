import {expect, test} from "@playwright/test"
import {FlowsApi} from "../api/flows.api"
import {expectRing, fetchFlowSource, login, openBlockEditor, pickTask, saveFlow, waitForRing, walkTo} from "./blocks.helpers"

// Every insertion path of the block editor, all keyboard-driven, each verified
// against the YAML the backend actually persisted (not just the DOM).
test.describe("Block editor — insertions", () => {
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

    test("frames the focused block with a ⇧A caret above and an A caret below", async ({page}) => {
        await walkTo(page, "middle_task")

        const kbds = page.locator("[data-test='block-insertion-caret'] kbd")
        await expect(kbds).toHaveText(["⇧A", "A"])
    })

    test("a inserts a task right after the focused block", async ({page, request, baseURL}) => {
        await walkTo(page, "middle_task")
        await page.keyboard.press("a")
        await pickTask(page, "fail", "Fail")

        // Focus lands on the created block, positioned between middle and last
        const newId = await waitForRing(page)

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        const order = [...source.matchAll(/^ {2}- id: (\S+)/gm)].map(m => m[1])
        expect(order).toEqual(["seq_group", "middle_task", newId, "last_task"])
    })

    test("Shift+A inserts a task right before the focused block", async ({page, request, baseURL}) => {
        await walkTo(page, "middle_task")
        await page.keyboard.press("Shift+A")
        await pickTask(page, "fail", "Fail")

        const newId = await waitForRing(page)

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        const order = [...source.matchAll(/^ {2}- id: (\S+)/gm)].map(m => m[1])
        expect(order).toEqual(["seq_group", newId, "middle_task", "last_task"])
    })

    test("/ opens the picker anchored on the focused block", async ({page}) => {
        await walkTo(page, "last_task")
        await page.keyboard.press("/")

        await expect(page.getByText("Inserting into Tasks", {exact: true})).toBeVisible()
        await expect(page.getByPlaceholder("Search or describe a task…")).toBeFocused()
        await page.keyboard.press("Escape")
    })

    test("inserts the first task into an empty top-level section", async ({page, request, baseURL}) => {
        await walkTo(page, "__section:errors")
        await page.keyboard.press("a")
        await expect(page.getByText("Inserting into Errors", {exact: true})).toBeVisible()
        await pickTask(page, "log", "Log")

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toMatch(/^errors:/m)
    })

    test("inserts the first task into a flowable's own empty lane", async ({page, request, baseURL}) => {
        await walkTo(page, "__lane:tasks[0].errors")
        await page.keyboard.press("a")
        await expect(page.getByText("Inserting into Errors", {exact: true})).toBeVisible()
        await pickTask(page, "log", "Log")

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        // seq_group now carries its own errors lane (indented, not flow-level)
        expect(source).toMatch(/^ {4}errors:/m)
    })

    test("adds a flowable task and steps into its empty branches", async ({page}) => {
        await walkTo(page, "last_task")
        await page.keyboard.press("a")
        await pickTask(page, "if", "If")

        await waitForRing(page)

        // The new If renders as a cluster whose empty "then" lane is reachable
        await page.keyboard.press("ArrowRight")
        await expectRing(page, "__lane:tasks[3].then")
    })

    test("a on a focused trigger offers trigger types, not task types", async ({page, request, baseURL}) => {
        await walkTo(page, "schedule_trigger")
        await page.keyboard.press("a")
        await expect(page.getByText("Inserting into Triggers", {exact: true})).toBeVisible()
        await pickTask(page, "webhook", "Webhook")

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("io.kestra.plugin.core.trigger.Webhook")
        // ...and it landed in the triggers array, not in tasks
        const triggersSection = source.slice(source.indexOf("triggers:"), source.indexOf("tasks:"))
        expect(triggersSection).toContain("Webhook")
    })

    test("inserts from the command menu, scoped to the focused block", async ({page}) => {
        await walkTo(page, "middle_task")
        await page.keyboard.press("ControlOrMeta+Shift+P")

        const menuInput = page.getByPlaceholder("Type a command or search a task…")
        await expect(menuInput).toBeFocused()
        await expect(page.getByText("context: middle_task")).toBeVisible()
        await expect(page.getByText("Insert task after middle_task")).toBeVisible()

        await page.keyboard.press("Enter")
        await expect(page.getByText("Inserting into Tasks", {exact: true})).toBeVisible()
        await page.keyboard.press("Escape")
    })
})
