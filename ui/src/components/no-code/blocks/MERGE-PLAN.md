# Merging Blocks into the flow Edit page

Status: **analysis only, not implemented.** Written up so the direction survives
past one chat session — see git history / PR discussion for the decision to
actually schedule it.

## Problem

The flow page currently shows two sibling top-level tabs that both claim to be
"how you edit this flow without raw YAML": **Edit** (the existing
Code/No-code/Topology/Docs/Files/Blueprints dock) and **Blocks** (the newer
canvas editor, with its own bespoke docking system for task editing). That's
not just a UX nit — it's a real architecture duplication, and it should be
fixed by folding Blocks into Edit's existing dock rather than keeping it a
separate page.

## Evidence (code-verified)

- **`FlowRoot.vue:113-130`** pushes `"edit"` (→ `MultiPanelFlowEditorView.vue`)
  and `"blocks"` (→ `BlockEditorPage.vue`) as two independent, both-`maximized`
  sibling tabs. They render as ordinary clickable pills via the generic
  `Tabs.vue`/`KsRouterTab` — nothing hides "Blocks", so a user sees **Edit**
  and **Blocks** side by side today.
- **The "Edit" tab's dock is already a fully-featured, dynamic tiling system**
  — not a fixed 6-tab shell as it looks at first glance:
  - `panelDefinition.ts` (`EDITOR_ELEMENTS`) defines 6 *base* elements (Flow
    Code / No-code / Topology / Docs / Files / Blueprints), but each element's
    `deserialize` can spawn **unlimited dynamic tabs** — proven twice already:
    `useFilesPanels.ts` opens N namespace files as separate tabs,
    `useNoCodePanels.ts` opens N tasks as separate tabs, both via the same
    reactive `panels` array.
  - `MultiPanelTabs.vue` already implements pane splitting (`splitPanel()`,
    `KsSplitter`) **and** full drag-and-drop of tabs between panes, including
    dropping into a brand-new pane (`dragstart`/`dragover`/`drop`/`moveTab`/
    `newPanelDrop`).
  - Layout persists via `useStoredPanels.ts`.
- **The Blocks canvas built its own parallel version of exactly that**: dock
  groups (`dockGroups`), a "split N" button, native drag-and-drop for
  re-parenting a tab into another group, per-group tabbars. None of it touches
  `MultiPanelFlowEditorView`, `KsSplitter`, or `useStoredPanels`.
- **The data contract is already unified**, which is what makes a merge
  tractable: both `NoCode.vue` and `BlockEditor.vue` read/write the same
  `flowStore.flowYaml` and call the same `flowStore.onEdit({source,
  topologyVisible: true})`. This is a UI/composition problem, not a
  data-model rewrite.
- Old no-code (`NoCode.vue`, form/schema-driven, ~258-line shell + ~5.2k LOC
  across `no-code/`) and Blocks (canvas/card-based, ~4.7k LOC) are comparable
  in size — this isn't "throw away a huge system for a toy," it's a genuine
  like-for-like replacement, and they already share `TaskEdit.vue` for the
  actual field-editing form.
- **This was the original plan, and it drifted**: Epic F's original decision
  was to integrate Blocks "as an additive flag-gated panel type in
  `EDITOR_ELEMENTS`... NOT a new page... DO NOT rebuild [the tiling dock]."
  What shipped is a second, separate top-level tab with a rebuilt mini-dock —
  exactly the anti-pattern that decision was meant to avoid.
- **PostHog** (`editor_tab_action`, `open`, ~13-week window, test accounts
  excluded): the no-code family runs ~15-20% of weekly tab-opens against
  `flow_code`'s ~80-85%. No `blocks` tab_type exists in the taxonomy yet —
  Blocks isn't instrumented or meaningfully exposed to real users, so this is
  the cheapest possible moment to consolidate, before any usage habit forms
  around its bespoke dock.

## Recommendation

Fold Blocks into the Edit tab's existing dock instead of keeping it as a
sibling page. Pinned down through `/plan-eng-review` (2026-07-06) — see the
Review Report at the bottom for the finding-by-finding reasoning:

1. **Remove the standalone `"blocks"` tab** from `FlowRoot.vue` (lines
   113-130) — one "Edit" entry point, not two.
2. **Register Blocks as the `"nocode"` `EditorElement`'s component** in
   `panelDefinition.ts`, gated behind a **new, dedicated** localStorage flag
   (e.g. `storageKeys.NOCODE_ENGINE` → `"nocodeEngine"`, values `"legacy"` |
   `"blocks"`, default `"blocks"`) rather than a hard cutover — gives a
   rollback path for a component with zero PostHog signal and no
   live-browser QA pass yet. **Do not reuse `EDITOR_VIEW_TYPE`**
   (`constants.ts:35`) for this — that flag controls which tab opens by
   *default* (code vs no-code), an orthogonal concern. Overloading it would
   mean a user who set `editorViewType=NO_CODE` just to land on the no-code
   tab by default gets silently bounced to legacy `NoCode.vue` too — two
   unrelated settings coupled by accident. [Caught in `/plan-design-review`,
   corrects the original `/plan-eng-review` recommendation above.] The
   `EditorElement`'s `uid` stays `"nocode"` regardless of which flag gates
   it — do **not** introduce a new `"blocks"` uid; see point 4.

   **Prerequisite before flipping the default to `"blocks"`** [added in
   `/plan-design-review`]: `BlockEditor.vue`'s canvas+splitter+dock layout
   was built and E2E-tested this session only at desktop viewport width —
   zero responsive coverage exists. `NoCode.vue` is a plain scrolling form,
   naturally usable (if cramped) on narrow viewports. Manually check
   `BlockEditor.vue` at tablet width (768px) before the default flips; if
   it's genuinely broken there, keep `"legacy"` as the default until fixed.
   Narrow-viewport flow editing is low-traffic, so this is a cheap gate
   (~15min), not a blocker on shipping the flag itself.
3. **Reuse `useNoCodePanels.ts`'s `openEditTaskTab`/`openAddTaskTab`
   directly** for Blocks' task-opening (not a parallel `useBlockPanels.ts`) —
   then delete Blocks' bespoke task-dock (`dockGroups`, split/tile/drag-drop
   logic) entirely. Clicking a block opens a real dock tab, splitting/
   tiling/dragging for free, one code path for both editors. Prerequisite:
   audit `useNoCodePanels.ts`'s tab uid/payload shape (currently
   `nocode-<json>`, NoCode-specific) for anything that assumes NoCode's data
   shape rather than the generic `{parentPath, refPath, action}` triple —
   generalize before Blocks calls it.
4. ~~Add `"blocks"`/`blocks-*` to `isTabFlowRelated()`~~ — **not needed**:
   since point 2 keeps the `"nocode"` uid instead of introducing a new one,
   the existing check (`MultiPanelFlowEditorView.vue:73-77`,
   `["code","nocode","topology"].includes(uid) || uid.startsWith("nocode-")`)
   already covers Blocks' dirty-state tracking with zero changes.
5. Keep `NoCode.vue` reachable behind the flag from point 2. Delete it (and
   its non-shared subtree — `TaskEdit.vue` is shared and survives) once
   **both**: 2 weeks with no regression reports on the flagged rollout, AND
   `editor_tab_action`'s `blocks` tab_type shows non-zero real usage in
   PostHog (proof it's actually being used, not just defaulted-to silently).

This is literally "reuse Edit's tab system," applied at the exact seam where
the duplication lives.

**Persisted-state safety (verified, no action needed):** reusing
`useNoCodePanels.ts` (point 3) means Blocks automatically inherits its
existing defensive deserialization — `setupInitialNoCodeTabIfExists`
(`useNoCodePanels.ts:150-153`) already drops a persisted tab whose task path
no longer resolves (`YAML_UTILS.extractBlockWithPath` returns falsy →
`return undefined`), and `parseTabId`'s `JSON.parse` is try/caught. A stale
`nocode-<json>` tab from before this change degrades gracefully instead of
crashing. This only holds because of point 3's decision — a parallel
`useBlockPanels.ts` would have needed to reimplement this guard from
scratch.

## Rationale

- **Nielsen consistency & standards**: one docking language (split/tile/drag)
  across the whole editor instead of two that behave slightly differently.
- **Net code reduction**: the dock/split machinery Blocks maintains gets
  deleted in favor of infrastructure already tested in production for
  Code/No-code/Topology/Files/Docs/Blueprints.
- **Zero-migration-risk window**: no users depend on Blocks' current dock
  behavior yet (no PostHog signal, no onboarding hook).
- **Matches the original architectural decision** already made for Epic F,
  which the current shipped state diverged from.

## Risks & open questions

- Real scoped implementation project (relocate the `EditorElement`, rewire
  task-open calls, delete dead dock code) — not a one-liner. Hand off to a
  dedicated implementation pass once scheduled.
- Need to decide what happens to `NoCode.vue`'s non-shared sub-tree
  (~5.2k LOC minus `TaskEdit.vue`) — likely deletable, but wants a quick audit
  for anything Blocks doesn't yet cover (e.g. plugin-defaults editing, which
  the E2E `blocks-canvas.yaml` fixture doesn't exercise). This audit is a
  prerequisite for the point-5 sunset, not for the initial flag-gated merge.
- **Known cost, not just a risk**: 12 existing tests exercise Blocks' current
  bespoke dock and will need rewriting against the unified dock once point 3
  lands — 3 unit tests in `BlockEditor.spec.ts` ("gives each tiled pane its
  own tabbar...", "merges a pane into another...") and the split-view/
  drag-pane tests in `blocks-mutations.spec.ts` (`split view gives each pane
  its own tabbar...`, `merges a pane into another...`, plus the `Ctrl/Cmd+S`
  and command-menu tests that assume Blocks' own footer/context strings).
  Budget ~half a day to port these to assert against `MultiPanelTabs.vue`'s
  behavior instead.
- Bundle size: `BlockEditor.vue` (~2.8k LOC + Monaco/KsTaskIcon deps) would
  replace `NoCode.vue` as an eager import in `MultiPanelFlowEditorView.vue`.
  No existing precedent for lazy-loading editor-shell tabs in this file
  (Topology/Docs/Files are all eager too), so this isn't a regression against
  current practice — deferred as a TODO, not blocking.
- Not verified live in the browser — this is a static-code analysis; worth a
  quick pass to confirm the two tabs visually before starting implementation.

## NOT in scope

- **Lazy-loading `BlockEditor.vue`** — deferred as a TODO (see below), not
  part of this merge.
- **Deleting `NoCode.vue`'s non-shared subtree in the same pass** — gated on
  the point-5 sunset criteria (2 weeks clean + real PostHog usage), not the
  initial merge PR.
- **A new `useBlockPanels.ts` composable** — explicitly rejected (finding 1);
  reuse `useNoCodePanels.ts` instead.
- **Rewriting the 12 affected tests as part of the design doc** — scoped and
  costed above, but the actual rewrite is implementation work, not part of
  this plan.
- **Full mobile/tablet redesign of `BlockEditor.vue`** — out of scope; the
  design review only asks for a pre-flip *check*, not a responsive rebuild.
- **A visible in-app UI toggle for the legacy/blocks engine choice** —
  the new `nocodeEngine` flag is an internal rollout lever (localStorage,
  no settings-page control), matching how `EDITOR_VIEW_TYPE` already works
  today. Exposing it as a user-facing setting is a separate, later decision.

## What already exists

Covered in full under Evidence above: `MultiPanelTabs.vue` (split/drag-drop),
`useNoCodePanels.ts`/`useFilesPanels.ts` (dynamic-tab pattern + the exact
defensive deserialization Blocks will inherit), `useStoredPanels.ts`
(layout persistence), and the shared `flowStore.flowYaml` contract. Nothing
in this plan requires new infrastructure — it's pure reuse.

## TODOs raised by this review

- **[P3] Lazy-load `BlockEditor.vue` via `defineAsyncComponent`** once it
  replaces `NoCode.vue` as the `"nocode"` element's component — no existing
  precedent in `MultiPanelFlowEditorView.vue` today, so not urgent, but worth
  revisiting once bundle-size data exists for the editor shell.

## Next step

When ready to implement, hand off to a dedicated implementation pass (e.g.
`/kestra-core-implementing` or a `kestra-core-developer` session) — this
document stops at the validated design.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 5 findings, all resolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score 6/10 → 9/10, 2 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

### Eng Review (`/plan-eng-review`, 2026-07-06)

**Step 0:** scope accepted as-is (core merge is 3 files / 0 new services;
`NoCode.vue` subtree deletion already correctly deferred by the plan itself).

**Findings resolved:**
1. [Architecture, 9/10] Reuse mechanism for step 3 was unspecified → decided:
   reuse `useNoCodePanels.ts` directly, not a new composable.
2. [Architecture, 8/10] Rollout strategy ("replacing (or...)") was ambiguous
   → decided: flag-gated, not a hard cutover (flag choice itself corrected
   by the design review below).
3. [Code quality, 7/10] `NoCode.vue` sunset criteria was vague ("briefly") →
   decided: 2 weeks clean + non-zero `blocks` PostHog usage.
4. [Architecture, 8/10] Persisted-tab crash risk on cutover → verified
   non-issue: `useNoCodePanels.ts:150-153` already guards this, inherited
   for free once finding 1 is applied.
5. [Architecture, 9/10] `isTabFlowRelated()` update (plan step 4) → found
   unnecessary once finding 2 is applied (uid stays `"nocode"`); removed
   from the plan, net simplification.

Test review: no gaps in the plan's own scope — the real gap is the migration
cost of 12 existing tests against the code this plan deletes, quantified in
Risks above. Performance: one finding (bundle-size/lazy-load), deferred as
a P3 TODO. Outside voice: skipped by user choice. Parallelization:
sequential, no lanes — all three core steps touch the same
`panelDefinition.ts`/`FlowRoot.vue`/`BlockEditor.vue` seam in dependency order.

### Design Review (`/plan-design-review`, 2026-07-06)

**Scope:** no new visual surface (both `BlockEditor.vue` and `NoCode.vue`
pre-exist and are already DS-compliant) — mockup generation (Step 0.5)
correctly skipped; ran a lighter IA/interaction/a11y pass instead of the
full 7-pass visual gauntlet.

**Initial score: 6/10** → **9/10** after fixes.

**Findings resolved:**
1. [Interaction states / rollout control, confidence 9/10 — verified against
   `constants.ts:35` and `panelDefinition.ts:19`] The eng review's flag
   choice (`EDITOR_VIEW_TYPE`) conflates two unrelated settings: which tab
   opens by default vs. which engine renders the no-code tab. **Fixed**:
   plan now specifies a new, dedicated `nocodeEngine` flag.
2. [Responsive & accessibility, confidence 8/10] `BlockEditor.vue` has zero
   responsive/tablet testing (built and E2E-tested at desktop width only
   this session); `NoCode.vue` degrades gracefully on narrow viewports.
   **Decided** (user): gate the default-flip on a manual 768px check,
   not a full responsive rebuild — added as a prerequisite under point 2.

Other passes: Information Architecture 8/10 (tab-order shift on removal is
self-resolving, not fixed); User Journey N/A (no new journey — existing
Blocks/NoCode UX is unchanged, only which one renders changes); AI Slop N/A
(no new visual generated); Design System Alignment 10/10 (pure reuse of
already-compliant components).

**VERDICT:** ENG + DESIGN CLEARED — ready to schedule implementation.

NO UNRESOLVED DECISIONS
