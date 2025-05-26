import minimist from "minimist";
import { $ } from "zx";
import { projectDir, runtimeDir } from "../actions/variables";

export async function dev(argv: minimist.ParsedArgs) {
  switch (argv._[1]) {
    case "update":
      console.log("Updating zxb");
      await $`npm install zxb@latest`;
      break;

    case "link":
      console.log("Linking zxb");
      await $`npm link ${argv._.slice(2)}`;
      break;

    case "create-task":
      if (!argv._[2]) {
        console.error("Please specify a task name:");
        console.error("Usage: ./zxb dev create-task <task-name>");
        process.exit(1);
      }
      const taskName = argv._[2];
      const taskPath = `${projectDir}/.zxb/${taskName}.task.ts`;
      await $`cp ${runtimeDir}/templates/task.ts ${taskPath}`.quiet();
      console.error(`Created new task:`);
      console.log(taskPath);
      console.error(`Run it using: ./zxb ${taskName}`);
      break;

    case "info":
      console.log("Info about zxb");
      await $`npm list zxb`;
      break;

    default:
      console.error(`unknown dev command ${argv._[1]}`);
      process.exit(1);
  }
}
