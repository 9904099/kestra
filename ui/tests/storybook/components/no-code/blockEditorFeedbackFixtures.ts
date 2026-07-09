import {setMockClient} from "@kestra-io/kestra-sdk"
import InitialSchema from "../../../../src/stores/flow-schema.json"

// A real CI/CD pipeline: checkout the repo, run a build script, run tests in
// parallel across two suites, then deploy — with realistic core task types
// and plausible property values, plus flow-level error/finally handlers.
export const CICD_PIPELINE_YAML = `id: deploy_service
namespace: company.platform
description: Build, test and deploy the payments service on every push to main.
tasks:
  - id: checkout
    type: io.kestra.plugin.core.flow.Subflow
    namespace: company.platform
    flowId: git_checkout
    inputs:
      repository: "{{ vars.repository }}"
      branch: main
  - id: build
    type: io.kestra.plugin.scripts.shell.Commands
    taskRunner:
      type: io.kestra.plugin.core.runner.Process
    commands:
      - ./gradlew build -x test
  - id: run_tests
    type: io.kestra.plugin.core.flow.Parallel
    tasks:
      - id: unit_tests
        type: io.kestra.plugin.scripts.shell.Commands
        commands:
          - ./gradlew test
      - id: integration_tests
        type: io.kestra.plugin.scripts.shell.Commands
        commands:
          - ./gradlew integrationTest
  - id: rollout
    type: io.kestra.plugin.core.flow.If
    condition: "{{ inputs.environment == 'production' }}"
    then:
      - id: notify_release_channel
        type: io.kestra.plugin.core.http.Request
        uri: https://hooks.example.com/release
        method: POST
        contentType: application/json
        body: "{{ {'service': 'payments', 'status': 'deploying'} | toJson }}"
      - id: deploy_production
        type: io.kestra.plugin.scripts.shell.Commands
        commands:
          - kubectl rollout restart deployment/payments -n production
    else:
      - id: deploy_staging
        type: io.kestra.plugin.scripts.shell.Commands
        commands:
          - kubectl rollout restart deployment/payments -n staging
    errors:
      - id: notify_rollout_failure
        type: io.kestra.plugin.core.log.Log
        level: ERROR
        message: "Rollout failed for {{ inputs.environment }}"
    finally:
      - id: record_deployment_metric
        type: io.kestra.plugin.core.log.Log
        message: Deployment attempt recorded
triggers:
  - id: on_push_to_main
    type: io.kestra.plugin.core.trigger.Webhook
    key: deploy-service-webhook
errors:
  - id: on_pipeline_error
    type: io.kestra.plugin.core.log.Log
    level: ERROR
    message: Pipeline failed — check the deploy_service execution logs
finally:
  - id: cleanup_workspace
    type: io.kestra.plugin.core.storage.PurgeCurrentExecutionFiles
`

// Same mock transport NoCode.stories.jsx uses: no real backend runs in
// Storybook, so `/flow` must resolve to the real flow-schema for the
// schema-driven task form (params, outputs, pluginDefaults hints) to render.
const PLUGINS_RESPONSE = [{
    name: "core",
    title: "core",
    group: "io.kestra.plugin.core",
    manifest: {
        "X-Kestra-Title": "core",
        "X-Kestra-Group": "io.kestra.plugin.core",
        "Manifest-Version": "1.0",
    },
    tasks: [
        "io.kestra.plugin.core.log.Log",
        "io.kestra.plugin.core.http.Request",
    ],
    triggers: [
        "io.kestra.plugin.core.trigger.Schedule",
        "io.kestra.plugin.core.trigger.Webhook",
    ],
    conditions: [],
}]

export function mockNoCodeTransport() {
    const axios: any = {}
    axios.get = (url: string) => {
        if (url.endsWith("plugins")) return Promise.resolve({data: PLUGINS_RESPONSE})
        if (url.endsWith("/flow")) return Promise.resolve({data: InitialSchema})
        return Promise.resolve({data: []})
    }
    axios.post = (url: string) => {
        if (url.endsWith("flows/validate/task")) return Promise.resolve({data: {}})
        return Promise.resolve({data: []})
    }
    setMockClient(axios)
}
