import { $ } from "zx";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

// Determine directories based on npm package scenarios only
async function determineDirectories() {
  // First, get the runtime directory (where the zxb code is located)
  let runtimeDir = await fs.realpath(path.join(dirname, ".."));
  let projectDir;

  // Check if we're running from a package in node_modules
  const isPackageInNodeModules = runtimeDir.includes("node_modules");

  if (isPackageInNodeModules) {
    // We're running from node_modules, so the project dir is the parent of node_modules
    const nodeModulesIndex = runtimeDir.indexOf("node_modules");
    projectDir = runtimeDir.substring(0, nodeModulesIndex - 1); // -1 to remove the trailing slash
  } else {
    // We're in development mode (using npm link)
    // In this case, the project dir is the current working directory
    projectDir = path.join(process.cwd(), "..");

    // Verify this is a valid project directory by checking for .zxb folder
    const zxbDirExists = await fs
      .access(path.join(projectDir, ".zxb"))
      .then(() => true)
      .catch(() => false);

    if (!zxbDirExists) {
      console.warn(
        `No .zxb directory found in ${projectDir}. This might not be a valid zxb project.`
      );
    }
  }

  // Ensure project directory is never the .zxb directory itself
  // If project directory ends with .zxb, correct it (safety check)
  if (projectDir.endsWith("/.zxb")) {
    projectDir = projectDir.substring(0, projectDir.length - 5);
  }

  // Look for package.json in the .zxb directory to verify this is the correct structure
  const packageJsonPath = path.join(projectDir, ".zxb", "package.json");
  const packageJsonExists = await fs
    .access(packageJsonPath)
    .then(() => true)
    .catch(() => false);

  if (!packageJsonExists && !isPackageInNodeModules) {
    console.warn(
      `No package.json found in ${path.join(
        projectDir,
        ".zxb"
      )}. This might not be a valid zxb project.`
    );
  }

  return { runtimeDir, projectDir };
}

const { runtimeDir, projectDir } = await determineDirectories();

export { runtimeDir, projectDir };

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
