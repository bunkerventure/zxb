#!/usr/bin/env zx
import minimist from "minimist";
const argv = minimist(process.argv.slice(2));
import { findAction, findActions, loadAction } from "../src/runtime.ts";

export async function run() {
  const actionName = argv._[1];

  if (!actionName) {
    const actions = await findActions();
    console.error(
      `Available actions are:\n${actions
        .map((x) => ` - ${x.name} (${x.type})`)
        .join("\n")}`
    );
    return;
  }

  const action = await loadAction(await findAction(actionName));
  if (!action.module.help) {
    console.error(
      `execute this action using:\n   ./build.mjs ${actionName}\n\nThis action does not have any additional help.`
    );
    return;
  }

  console.error(action.module.help.trim());
  console.error("");
}
