import minimist from "minimist";
import { $ } from "zx";

export async function install(argv: minimist.ParsedArgs) {
  await $`npm install ${argv._[1]}`;
}
