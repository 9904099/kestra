import type {APIRequestContext, Page} from "@playwright/test"
import {expect} from "@playwright/test"
import {shared} from "../fixtures/shared"

export const TENANT = process.env.E2E_TENANT ?? "main"

export async function login(page: Page) {
    await page.goto("/ui")
    await page.getByRole("textbox", {name: "Email"}).fill(shared.username)
    await page.getByRole("textbox", {name: "Password"}).fill(shared.password)
    await page.getByRole("button", {name: "Login"}).click()
    await page.waitForURL(url => !url.pathname.includes("login"))
}

export async function openBlockEditor(page: Page, flowId: string) {
    await page.goto(`/ui/${TENANT}/flows/edit/${shared.namespace}/${flowId}/blocks`)
    await expect(page.locator("[data-test='block-editor']")).toBeVisible()
    await expect(page.locator("[data-block-id]").first()).toBeVisible()
}

// The id of the block currently carrying the keyboard focus ring. The ring
// class lands on the card root for leaves/sentinels and on the header for
// flowable clusters, hence the closest() fallback.
export async function ringId(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        const el = document.querySelector(".block-kbd-focused")
        if (!el) return null
        return el.getAttribute("data-block-id")
            ?? el.closest("[data-block-id]")?.getAttribute("data-block-id")
            ?? null
    })
}

export async function expectRing(page: Page, id: string) {
    await expect(async () => {
        expect(await ringId(page)).toBe(id)
    }).toPass({timeout: 5000})
}

// Reads the ring id, retrying briefly — the ring can lag a tick behind an
// action that creates a brand-new block (insertion, duplication).
export async function waitForRing(page: Page): Promise<string> {
    let id: string | null = null
    await expect(async () => {
        id = await ringId(page)
        expect(id).toBeTruthy()
    }).toPass({timeout: 5000})
    return id as unknown as string
}

// Press ArrowDown/ArrowUp until the ring lands on the target block. Bounded so
// a regression fails fast instead of looping forever.
export async function walkTo(page: Page, targetId: string, direction: "down" | "up" = "down") {
    const key = direction === "down" ? "ArrowDown" : "ArrowUp"
    for (let i = 0; i < 25; i++) {
        if (await ringId(page) === targetId) return
        await page.keyboard.press(key)
    }
    expect(await ringId(page), `walkTo(${targetId}) never reached its target`).toBe(targetId)
}

// Search the insert picker and confirm the top (already-highlighted) match
// with the keyboard — the picker preselects the first result, so no
// ArrowDown is needed (pressing one would skip onto the second match).
export async function pickTask(page: Page, search: string, optionTitle: string) {
    const input = page.getByPlaceholder("Search or describe a task…")
    await expect(input).toBeVisible()
    await input.fill(search)
    await expect(page.getByText(optionTitle, {exact: true}).first()).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(input).toBeHidden()
}

export async function saveFlow(page: Page) {
    await page.keyboard.press("ControlOrMeta+s")
    await expect(page.getByText("Successfully saved", {exact: false}).first()).toBeVisible()
}

export async function fetchFlowSource(request: APIRequestContext, baseURL: string, flowId: string): Promise<string> {
    const auth = `Basic ${Buffer.from(`${shared.username}:${shared.password}`).toString("base64")}`
    const response = await request.get(
        `${baseURL}/api/v1/flows/${shared.namespace}/${flowId}?source=true`,
        {headers: {Authorization: auth, Accept: "application/json"}},
    )
    expect(response.status()).toBe(200)
    return (await response.json()).source as string
}

// Ids of the canvas cards in DOM order — the user-visible block order.
export async function canvasCardIds(page: Page): Promise<string[]> {
    return page.locator("[data-test='block-card'][data-block-id]")
        .evaluateAll(els => els.map(el => el.getAttribute("data-block-id") ?? ""))
}
