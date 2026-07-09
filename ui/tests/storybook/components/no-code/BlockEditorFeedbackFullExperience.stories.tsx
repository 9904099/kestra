import type {Meta, StoryObj} from "@storybook/vue3-vite"
import {within, userEvent, expect, waitFor} from "storybook/test"
import {vueRouter} from "storybook-vue3-router"

import MultiPanelFlowEditorView from "../../../../src/components/flows/MultiPanelFlowEditorView.vue"
import {useFlowStore} from "../../../../src/stores/flow"
import {CICD_PIPELINE_YAML, mockNoCodeTransport} from "./blockEditorFeedbackFixtures"

const meta: Meta = {
    title: "No-code/Feedback fixes",
    parameters: {
        layout: "fullscreen",
    },
}

export default meta
type Story = StoryObj

// Kept in its own file: MultiPanelFlowEditorView pulls in the whole flow-editor
// shell (playground, files panels, topology, onboarding), which meaningfully
// slows down module loading for every OTHER story if bundled alongside them.
//
// The truest "complete no-code" demo: the real top-level flow editor shell
// (canvas + task-edit tab living together via useNoCodePanels/MultiPanel),
// not just BlockEditor in isolation. Clicking a block opens its editor as a tab.
export const FullExperienceMultiPanelFlowEditor: Story = {
    decorators: [
        vueRouter([
            {path: "/", name: "home", component: {template: "<div>home</div>"}},
            {path: "/flows/edit/:namespace/", name: "flows/edit", component: {template: "<div>update flows</div>"}},
        ]),
    ],
    render: () => ({
        setup() {
            mockNoCodeTransport()
            const flowStore = useFlowStore()
            flowStore.flow = {id: "deploy_service", namespace: "company.platform", source: CICD_PIPELINE_YAML} as any
            flowStore.flowYaml = CICD_PIPELINE_YAML
            return () => (
                <div style="height: 100vh;">
                    <MultiPanelFlowEditorView />
                </div>
            )
        },
    }),
    parameters: {
        docs: {
            description: {
                story: "The complete no-code experience: the real flow-editor shell wires the Blocks canvas and the task-edit panel together as sibling tabs in the same dock (via `useNoCodePanels`), exactly as in production. Clicking the `build` block opens its full task-edit panel as a new tab alongside the canvas.",
            },
        },
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement)
        const buildCard = await waitFor(() => {
            const el = canvas.getByText("build")
            expect(el).toBeInTheDocument()
            return el
        })

        await userEvent.click(buildCard)

        await waitFor(() => {
            expect(canvasElement.querySelector("[data-test='block-editor-task-edit'], [data-test='task-edit-panel']")).toBeInTheDocument()
        })
    },
}
