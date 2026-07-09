import type {Meta, StoryObj} from "@storybook/vue3-vite"
import {within, userEvent, expect} from "storybook/test"
import {ref} from "vue"
import DagDependsOnEditor from "../../../../src/components/no-code/blocks/DagDependsOnEditor.vue"

const meta: Meta<typeof DagDependsOnEditor> = {
    title: "No-code/Feedback fixes",
    component: DagDependsOnEditor,
}

export default meta
type Story = StoryObj<typeof DagDependsOnEditor>

const makeRender = (dependsOn: string[], siblingIds: string[]): Story["render"] => () => ({
    setup() {
        const model = ref(dependsOn)
        return () => (
            <div style="max-width: 420px; padding: 1rem; background: var(--ks-bg-surface);">
                <DagDependsOnEditor
                    dependsOn={model.value}
                    siblingIds={siblingIds}
                    onUpdate={(value: string[]) => model.value = value}
                />
            </div>
        )
    },
})

export const F3DagDependsOnEmpty: Story = {
    render: makeRender([], ["extract", "transform", "load"]),
    parameters: {
        docs: {
            description: {
                story: "Problem: a DAG sub-task's dependencies could only be set by hand-editing YAML. Fix: this dedicated `DagDependsOnEditor` control lets a no-code user pick dependencies from its siblings — shown here with no dependency selected yet.",
            },
        },
    },
}

export const F3DagDependsOnSingle: Story = {
    render: makeRender(["extract"], ["extract", "transform", "load"]),
    parameters: {
        docs: {
            description: {
                story: "Problem: a DAG sub-task's dependencies could only be set by hand-editing YAML. Fix: the control shows one selected dependency (\"extract\") as a removable tag.",
            },
        },
    },
}

export const F3DagDependsOnMultiple: Story = {
    render: makeRender(["extract", "transform"], ["extract", "transform", "load"]),
    parameters: {
        docs: {
            description: {
                story: "Problem: a DAG sub-task's dependencies could only be set by hand-editing YAML. Fix: several dependencies (\"extract\", \"transform\") can be selected at once from the sibling list.",
            },
        },
    },
}

export const F3DagDependsOnLongSiblingList: Story = {
    render: makeRender(
        ["extract_crm", "extract_billing", "extract_support_tickets", "extract_marketing_events"],
        ["extract_crm", "extract_billing", "extract_support_tickets", "extract_marketing_events", "extract_product_usage", "merge_datasets"],
    ),
    parameters: {
        docs: {
            description: {
                story: "Problem: a DAG with many sub-tasks had no way to review a long dependency list at a glance. Fix: with four dependencies selected out of six siblings, the select's tag-collapse kicks in, keeping the control compact.",
            },
        },
    },
}

export const F3DagDependsOnInteraction: Story = {
    render: makeRender([], ["extract", "transform", "load"]),
    parameters: {
        docs: {
            description: {
                story: "Interactive proof: opening the select and picking a sibling adds it as a dependency, demonstrating the no-code control that replaces manual YAML editing of `dependsOn`.",
            },
        },
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement)
        const select = canvasElement.querySelector("[data-test='dag-depends-on-select']") as HTMLElement
        await userEvent.click(select)

        const option = await canvas.findByText("extract")
        await userEvent.click(option)

        await expect(select.textContent).toContain("extract")
    },
}
