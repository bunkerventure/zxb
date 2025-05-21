import { $ } from 'zx'
import yaml from 'yaml'
import minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { projectDir, isCI } from './variables'
import fs from 'fs/promises'

export const name = "Cleanup pods"

export async function run() {
    const podsJson = await $`kubectl get pods -A -o json`.quiet()
    const pods = JSON.parse(podsJson.toString())
    const failureReasons = ["Error", "ContainerStatusUnknown", "Evicted"]
    const failedPods: Array<any> = pods.items.filter(x => failureReasons.includes(x.status.reason) || x.status.conditions.find(c => c.type == "Ready")?.status == "PodCompleted")
    console.log(`Found ${failedPods.length} failed pods`)

    const namespacedPods: { [key: string]: Array<string> } = failedPods.reduce((np, pod) => {
        return {
            ...np,
            [pod.metadata.namespace]: [...(np[pod.metadata.namespace] || []), pod.metadata.name as string]
        }
    }, {})

    for (const [namespace, pods] of Object.entries(namespacedPods)) {
        console.log(`Deleting ${pods.length} pods in namespace ${namespace}`)
        //await $`kubectl delete pods -n ${namespace} ${pods}`
    }
}

