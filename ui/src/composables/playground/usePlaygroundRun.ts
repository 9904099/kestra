import {usePlaygroundStore} from "../../stores/playground"

export function usePlaygroundRun() {
    const playgroundStore = usePlaygroundStore()

    function runTask(taskId?: string, downstream = false) {
        if (!taskId) return
        if (!playgroundStore.enabled) {
            playgroundStore.enabled = true
        }
        playgroundStore.runUntilTask(taskId, downstream)
    }

    return {runTask}
}
