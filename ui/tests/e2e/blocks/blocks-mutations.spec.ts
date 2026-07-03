import {expect, test} from "@playwright/test"
import {FlowsApi} from "../api/flows.api"
import {canvasCardIds, expectRing, fetchFlowSource, login, openBlockEditor, saveFlow, taskIdsInOrder, walkTo} from "./blocks.helpers"

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
        expect(taskIdsInOrder(source)).toEqual(["seq_group", "middle_task", "middle_task_copy", "last_task"])
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
        expect(taskIdsInOrder(source)).toEqual(["seq_group", "last_task", "middle_task"])
    })

    test("split view gives each pane its own tabbar, with no tab duplicated, and supports per-pane close", async ({page}) => {
        await page.locator("[data-block-id='middle_task']").click()
        await page.locator("[data-block-id='last_task']").click()
        await page.locator("[data-test='block-editor-split-2']").click()

        // Each tiled tab now has its own group/tabbar (VSCode editor groups) —
        // no tab appears twice across the two tabbars
        await expect(page.locator(".block-editor-dock-group")).toHaveCount(2)
        await expect(page.locator("[data-test='block-editor-dock-tab-middle_task']")).toHaveCount(1)
        await expect(page.locator("[data-test='block-editor-dock-tab-last_task']")).toHaveCount(1)

        // Closing a pane's tab actually closes that pane
        await page.locator("[data-test='block-editor-dock-tab-close-last_task']").click()
        await expect(page.locator("[data-dock-pane-id='last_task']")).toBeHidden()
        await expect(page.locator("[data-dock-pane-id='middle_task']")).toBeVisible()
    })

    test("merges a pane into another when its tab is dropped there, collapsing the emptied pane", async ({page}) => {
        await page.locator("[data-block-id='middle_task']").click()
        await page.locator("[data-block-id='last_task']").click()
        await page.locator("[data-test='block-editor-split-2']").click()

        const paneOrder = () => page.locator("[data-dock-pane-id]:visible")
            .evaluateAll(els => els.map(el => el.getAttribute("data-dock-pane-id")))
        // Splitting redeals by recency — last_task (clicked most recently) anchors first
        expect(await paneOrder()).toEqual(["last_task", "middle_task"])

        await page.locator("[data-test='block-editor-dock-tab-middle_task']")
            .dragTo(page.locator("[data-dock-pane-id='last_task']"))

        // The emptied pane closes (VSCode editor-group behavior); both tabs now
        // live together in the surviving pane, with the dropped-in tab active
        await expect(page.locator(".block-editor-dock-group")).toHaveCount(1)
        expect(await paneOrder()).toEqual(["middle_task"])
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
        expect(taskIdsInOrder(source)).toEqual(["seq_group", "last_task_copy", "middle_task"])

        const canvasOrder = (await canvasCardIds(page)).filter(id => !id.startsWith("__"))
        expect(canvasOrder.slice(-2)).toEqual(["last_task_copy", "middle_task"])
    })
})
