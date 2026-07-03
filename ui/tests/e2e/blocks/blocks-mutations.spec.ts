import {expect, test} from "@playwright/test"
import {FlowsApi} from "../api/flows.api"
import {canvasCardIds, expectRing, fetchFlowSource, login, openBlockEditor, saveFlow, walkTo} from "./blocks.helpers"

// Destructive/structural mutations (duplicate, delete + undo, reorder) and the
// split-view multi-pane behaviors, all keyboard-first.
test.describe("Block editor — mutations & split view", () => {
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

    test("d duplicates the focused block right after it", async ({page, request, baseURL}) => {
        await walkTo(page, "middle_task")
        await page.keyboard.press("d")

        await expect(page.locator("[data-block-id='middle_task_copy']")).toBeVisible()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        const order = [...source.matchAll(/^ {2}- id: (\S+)/gm)].map(m => m[1])
        expect(order).toEqual(["seq_group", "middle_task", "middle_task_copy", "last_task"])
    })

    test("Backspace deletes after an Enter-confirmed dialog, moves focus to the neighbor, and Undo restores", async ({page}) => {
        await walkTo(page, "middle_task")
        await page.keyboard.press("Backspace")

        // Dialog opens with focus on the Delete button and a REAL block name
        const dialog = page.locator(".kel-message-box")
        await expect(dialog).toBeVisible()
        await expect(dialog).toContainText("Delete middle_task?")
        await page.keyboard.press("Enter")

        // Gone, focus continues from the deletion point, undo pill offered
        await expect(page.locator("[data-block-id='middle_task']")).toBeHidden()
        await expectRing(page, "last_task")
        await page.locator("[data-test='block-editor-undo']").click()
        await expect(page.locator("[data-block-id='middle_task']")).toBeVisible()
    })

    test("Delete on an empty-section placeholder is a no-op", async ({page}) => {
        await walkTo(page, "__section:errors")
        await page.keyboard.press("Backspace")
        await expect(page.locator(".kel-message-box")).toBeHidden()
    })

    test("Alt+Arrow reorders the focused block and the order persists", async ({page, request, baseURL}) => {
        await walkTo(page, "middle_task")
        await page.keyboard.press("Alt+ArrowDown")
        await expectRing(page, "middle_task")

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        const order = [...source.matchAll(/^ {2}- id: (\S+)/gm)].map(m => m[1])
        expect(order).toEqual(["seq_group", "last_task", "middle_task"])
    })

    test("split view labels each pane, dedupes the tabbar, and supports per-pane close", async ({page}) => {
        await page.locator("[data-block-id='middle_task']").click()
        await page.locator("[data-block-id='last_task']").click()
        await page.locator("[data-test='block-editor-split-2']").click()

        // Each tiled pane shows its own label next to its own content…
        const middlePane = page.locator("[data-dock-pane-id='middle_task']")
        const lastPane = page.locator("[data-dock-pane-id='last_task']")
        await expect(middlePane.locator("[data-test='task-edit-tab']")).toContainText("middle_task")
        await expect(lastPane.locator("[data-test='task-edit-tab']")).toContainText("last_task")

        // …so the shared tabbar lists nothing twice (both tabs are tiled)
        await expect(page.locator(".block-editor-dock-tabbar [role='tab']")).toHaveCount(0)

        // Closing from a pane's own label actually closes that tab
        await lastPane.locator("[data-test='task-edit-tab-close']").click()
        await expect(page.locator("[data-dock-pane-id='last_task']")).toBeHidden()
        await expect(middlePane).toBeVisible()
    })

    test("dragging a pane's tab onto the other pane swaps their sides", async ({page}) => {
        await page.locator("[data-block-id='middle_task']").click()
        await page.locator("[data-block-id='last_task']").click()
        await page.locator("[data-test='block-editor-split-2']").click()

        const paneOrder = () => page.locator("[data-dock-pane-id]:visible")
            .evaluateAll(els => els.map(el => el.getAttribute("data-dock-pane-id")))
        expect(await paneOrder()).toEqual(["middle_task", "last_task"])

        await page.locator("[data-dock-pane-id='middle_task'] [data-test='task-edit-tab']")
            .dragTo(page.locator("[data-dock-pane-id='last_task']"))

        expect(await paneOrder()).toEqual(["last_task", "middle_task"])
    })

    test("the command menu jumps between sections", async ({page}) => {
        await page.keyboard.press("ControlOrMeta+Shift+P")
        const menuInput = page.getByPlaceholder("Type a command or search a task…")
        await expect(menuInput).toBeFocused()

        await menuInput.fill("errors")
        await expect(page.getByText("Go to Errors", {exact: true})).toBeVisible()
        await page.keyboard.press("Enter")

        await expectRing(page, "__section:errors")
    })

    test("Ctrl/Cmd+S saves the draft from the blocks page", async ({page, request, baseURL}) => {
        // Mutate something first so there is a draft to save
        await walkTo(page, "middle_task")
        await page.keyboard.press("d")
        await expect(page.locator("[data-block-id='middle_task_copy']")).toBeVisible()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        expect(source).toContain("middle_task_copy")
    })

    test("the canvas order shown matches the persisted order after mixed mutations", async ({page, request, baseURL}) => {
        // duplicate, then reorder the copy up, then delete the original
        await walkTo(page, "last_task")
        await page.keyboard.press("d")
        await expect(page.locator("[data-block-id='last_task_copy']")).toBeVisible()
        await walkTo(page, "last_task_copy")
        await page.keyboard.press("Alt+ArrowUp")
        await page.keyboard.press("Alt+ArrowUp")
        await walkTo(page, "last_task", "down")
        await page.keyboard.press("Backspace")
        await page.keyboard.press("Enter")
        await expect(page.locator("[data-block-id='last_task']")).toBeHidden()

        await saveFlow(page)
        const source = await fetchFlowSource(request, baseURL!, flowId)
        const order = [...source.matchAll(/^ {2}- id: (\S+)/gm)].map(m => m[1])
        expect(order).toEqual(["seq_group", "last_task_copy", "middle_task"])

        const canvasOrder = (await canvasCardIds(page)).filter(id => !id.startsWith("__"))
        expect(canvasOrder.slice(-2)).toEqual(["last_task_copy", "middle_task"])
    })
})
