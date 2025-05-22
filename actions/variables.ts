import { $ } from "zx";
import fs from "fs/promises";
import path from "path";

const dirname = path.dirname(new URL(import.meta.url).pathname);

export const runtimeDir = await fs.realpath(path.join(dirname, ".."));
export const projectDir = await fs.realpath(path.join(runtimeDir, "..", ".."));

export const isCI = !!process.env.BUILD_BUILDID;

// export const branchName = await (async () => {
//   if (process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH) {
//     return process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH.replace(
//       /refs\/heads\//,
//       ""
//     );
//   } else if (process.env.BUILD_SOURCEBRANCHNAME) {
//     return process.env.BUILD_SOURCEBRANCHNAME;
//   } else if (process.env.BRANCHNAME) {
//     return process.env.BRANCHNAME;
//   } else {
//     return (await $`git rev-parse --abbrev-ref HEAD`.quiet()).toString().trim();
//   }
// })();
// export const safeBranchName = branchName.replace("/", "-");
