# Blocks editor E2E test plan

Persistent Playwright regression suite for the Blocks canvas
(`ui/src/components/no-code/blocks/`), kept long-term to QA every
iteration of this feature — not a one-off report.

## Scope

Everything a keyboard-first user can do on the Blocks tab of the flow
editor: navigating the canvas, inserting every kind of block, editing
every kind of form input, and mutating the tree (duplicate/delete/reorder/
split-view). All flows through real keyboard interaction against a live
dev server and backend, with mutations verified against the YAML the
backend actually persisted — not just the DOM.

## Fixture

`tests/e2e/fixtures/flows/blocks-canvas.yaml` — one flow exercising every
canvas shape the suite needs to walk and mutate:
- a disabled Schedule trigger
- a `Sequential` flowable with two child tasks and its own empty
  errors/finally lanes (covers step-into/out, nested lanes)
- two top-level leaf tasks
- empty top-level errors/finally sections (covers empty-state insertion)

## Files

| File | Covers |
|---|---|
| `blocks-navigation.spec.ts` | Keyboard-only canvas navigation |
| `blocks-insert.spec.ts` | Every insertion entry point |
| `blocks-edit-forms.spec.ts` | Every generated-form input family |
| `blocks-mutations.spec.ts` | Duplicate, delete, reorder, split view, command menu, save |
| `blocks.helpers.ts` | Shared login/open/ring/insert/save/fetch-YAML helpers |

## Coverage detail

**Navigation** (`blocks-navigation.spec.ts`)
- Forward walk through every stop (trigger → flowable → children → its
  own empty lanes → leaf tasks → empty top-level sections) with wrap-around
- Backward walk with ArrowUp
- Step into a group (ArrowRight) / back to parent (ArrowLeft)
- Collapse/expand a group with ArrowLeft/ArrowRight
- Tab enters the canvas as a single composite stop (roving tabindex) and
  a single Tab exits it entirely; arrows move real DOM focus in lockstep
- Clicking a card syncs the keyboard ring
- Dock-pane focus: ArrowRight/ArrowLeft walks Inputs → Form → back to card
- Escape backs out one level at a time (dock field → panel → gone)
- Help overlay open/close (`?` / Escape)

**Insertion** (`blocks-insert.spec.ts`)
- Insertion caret shows `⇧A` above / `A` below the focused block
- `a` inserts after the focused block; `Shift+A` inserts before it —
  both round-tripped through save and verified in persisted YAML order
- `/` opens the picker anchored on the focused block
- First insertion into an empty top-level section and into a flowable's
  own empty lane (both persisted-YAML checked)
- Inserting a flowable task and stepping into its newly-created empty
  branch
- Inserting on a focused trigger offers trigger types, not task types
  (regression for a real bug: this used to leak task types into the
  triggers array)
- Command menu insertion, scoped to the currently focused block

**Form editing** (`blocks-edit-forms.spec.ts`) — every generated-form
input family, each verified against persisted YAML:
- Renaming a task's id via the inline Monaco id field, canvas card follows
- Editing a plain text field (message)
- String ⇄ Array segmented toggle
- Enum select (inside a collapsed "Optional" group)
- Boolean switch (inside a collapsed "Execution" group)
- Duration field via its preset buttons
- Raw Source-tab YAML edit, canvas syncs from it
- Regression: editing one open tab's Source must never bleed into another
  open tab (they used to share one Monaco model)
- Regression: two tasks sharing the same id keep visually distinct focus
  rings (disambiguated dom ids)

**Mutations & split view** (`blocks-mutations.spec.ts`)
- `d` duplicates the focused block right after it, persisted order checked
- `Backspace` → confirm dialog → delete → focus moves to a neighbor →
  Undo restores the block
- `Backspace` on an empty-section placeholder is a no-op (no dialog)
- `Alt+Arrow` reorders the focused block, persisted order checked
- Split view: each tiled pane shows its own label, the shared tabbar never
  repeats a name, and a pane can be closed independently
- Dragging one pane's tab onto another re-parents it (VSCode editor-group
  behavior)
- Command menu jumps between sections
- `Ctrl/Cmd+S` saves the draft from the Blocks page itself (this page does
  not mount `NoCode.vue`'s global save handler, so it needs its own)
- A combined duplicate → reorder → delete sequence checked end-to-end
  against both the canvas DOM order and the persisted YAML order

## Running

Against a local dev server + backend for this worktree (not the
Docker-based `start-e2e-tests-backend.sh`, which serves a published
`develop` image that doesn't have this feature):

```bash
cd ui
E2E_BASE_URL=http://localhost:5174 \
E2E_USERNAME=<your dev login> \
E2E_PASSWORD=<your dev password> \
npx playwright test --config=tests/e2e/playwright.config.ts tests/e2e/blocks/
```

Each spec creates its fixture flow via the API in `beforeEach` and deletes
it in `afterEach` (`FlowsApi.generateFlowViaApi` / `removeFlowsViaApi`),
so runs are self-cleaning against whatever backend `E2E_BASE_URL` points
to.

## Known gaps / follow-ups

- Coverage is Log/Sequential/If/Schedule/Webhook/Fail task types plus the
  generated-form input families they exercise (text, array, enum,
  boolean, duration, raw source). Plugin-specific input widgets outside
  those families (e.g. file upload, code-editor-typed properties) are not
  yet covered.
- No visual-regression (screenshot diff) coverage — this suite asserts
  behavior and persisted YAML, not pixels.
