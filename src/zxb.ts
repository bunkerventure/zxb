import { ProcessOutput } from "zx";
import {
  findActions,
  loadAction,
  runJob,
  runPipeline,
  listActionsOutput,
} from "./runtime.js";
import minimist from "minimist";

async function main() {
  const argv = minimist(process.argv.slice(2));

  const actions = await findActions();

  const actionName = argv._[0];
  if (!actionName || !actions.find((x) => x.name === actionName)) {
    console.error(
      `could not find action ${actionName}.\n\n${await listActionsOutput()}`
    );
    process.exit(1);
  }

  const actionFile = actions.find((x) => x.name === actionName);

  switch (actionFile?.type) {
    case "task":
      const task = await loadAction(actionFile);
      if (task.module.run) {
        await task.module.run();
      }
      break;
    case "job":
      const job = await loadAction(actionFile);
      await runJob(job, null);
      break;
    case "pipeline":
      const pipeline = await loadAction(actionFile);
      await runPipeline(pipeline);
      break;
    default:
      throw new Error(`unknown action type ${actionFile?.type}`);
  }
}

export default function () {
  main().catch((err) => {
    console.error("Error running zxb: " + err);
    console.error(err.stack);
    process.exit(1);
  });
}
