import { $ } from "zx";
import yaml from "yaml";
import minimist from "minimist";
const argv = minimist(process.argv.slice(2));

import { projectDir, isCI } from "./variables";
import fs from "fs/promises";

export const name = "Render helm chart";

export async function run() {
  await $`flux reconcile kustomization ${argv._[0]} --with-source`;
}
