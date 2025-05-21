import { $, fs, question } from "zx";
import { globby } from "globby";
import { projectDir, isCI } from "../actions/variables.js";
import chalk from "chalk";
import minimist from "minimist";
import path from "path";

const argv = minimist(process.argv.slice(2));

// local registry for completed runs
const completedRuns = {};

type ActionFile = {
  name: string;
  path: string;
  type: string | undefined;
  ext: string | undefined;
};

async function findFiles(glob: string): Promise<ActionFile[]> {
  const files = await globby(glob, { objectMode: true, onlyFiles: true });
  return files.map((f) => {
    const pathOnly = path.dirname(f.path);
    const fileName = path.basename(f.path);
    const parts = fileName.split(".");
    return {
      name:
        parts.length < 3
          ? parts[0]
          : parts.slice(0, parts.length - 2).join("."),
      path: f.path,
      type: parts.length >= 3 ? parts[parts.length - 2] : undefined,
      ext: parts.length >= 2 ? parts[parts.length - 1] : undefined,
    };
  });
}

export async function findActionPaths() {
  return [`${projectDir}/.zxb`, `${projectDir}/.zxb/.runtime/actions`];
}

export async function findActions(): Promise<Array<ActionFile>> {
  const actionPaths = await findActionPaths();
  return (
    await Promise.all(
      actionPaths.map((p) => {
        return findFiles(p);
      })
    )
  )
    .flat()
    .filter(
      (f) => f.type === "task" || f.type === "job" || f.type === "pipeline"
    );
}

export async function findAction(name) {
  const actions = await findActions();
  const job = actions.find((a) => a.name === name);
  if (!job) {
    throw new Error(
      `no action with name ${name}.\n\n${await listActionsOutput()}`
    );
  }
  return job;
}

export async function listActionsOutput() {
  const actions = await findActions();
  const actionPaths = await findActionPaths();
  return `Available actions are:${actions
    .map((x) => `\n - ${x.name} (${x.type})`)
    .join("")}\n\nActions are found in:\n${actionPaths
    .map((x) => "\n- " + x)
    .join("")}\n`;
}

export async function loadAction(actionFile) {
  if (!actionFile.path) {
    throw new Error(`cannot load action ${actionFile}`);
  }
  let mod = await import(`${actionFile.path}`);
  if (!mod) {
    throw new Error(`could not load action ${actionFile.name} `);
  }
  return { ...actionFile, module: mod };
}

export async function runPipeline(pipeline) {
  pipeline = await loadAction(pipeline);
  for (const job of pipeline.module.spec.jobs) {
    await runJob(job, pipeline);
  }
}

export async function runJob(job, pipeline) {
  const action = await loadAction(job);

  if (!isCI) {
    const dependenctJobs = (action.module.dependencies || []).filter(
      (x) => x.job
    );
    for (const dependency of dependenctJobs) {
      const depedencyAction = await findAction(dependency.job);
      await runJob(depedencyAction, null);
    }
  }

  const parallization = calculateParallization(action);

  console.error(chalk.green(`Running ${chalk.bold(action.module.name)} `));
  console.error(
    chalk.green(
      `  require capabilities:${action.module?.capabilities
        .map((x) => `\n   - ${x}`)
        .join("")} `
    )
  );
  if (!parallization.enabled && parallization.maxJobs) {
    console.error(
      chalk.green(
        `  with parallelization disabled(max: ${parallization.maxJobs})`
      )
    );
  } else if (parallization.enabled) {
    console.error(chalk.green(`  with parallelization: `));
    console.error(
      chalk.green(
        `    total:   ${parallization.totalJobs} (max: ${parallization.maxJobs})`
      )
    );
    console.error(chalk.green(`    current: ${parallization.jobNumber} `));
  }

  const input = { variables: {}, parallization };
  if (action.module.dependencies) {
    for (let d of action.module.dependencies) {
      if (d.job) {
        for (let v of d.variables || []) {
          if (isCI) {
            input.variables[v] = process.env[v];
          } else {
            input.variables[v] = completedRuns[d.job].variables[v];
          }
        }
      } else if (d.variable) {
        if (isCI) {
          input.variables[d.variable] = process.env[d.variable];
        } else {
          input.variables[d.variable] =
            pipeline?.module.spec.variables[d.variable];
        }
      } else if (d.parameter) {
        if (isCI) {
          input.variables[d.parameter] = process.env[d.parameter];
        } else {
          let value = await question(
            `Parameter ${d.parameter} required.Type in value: `
          );
          input.variables[d.parameter] = value;
        }
      } else {
        throw new Error(
          `unhandled dependency in job ${action.name}: \n${JSON.stringify(
            d,
            null,
            2
          )} `
        );
      }
    }
  }

  const output = await action.module.run(input);

  console.error(chalk.green(`Completed ${chalk.bold(action.module.name)} `));
  if (output?.variables) {
    console.error(chalk.green(`  with variables: `));
    if (!isCI) {
      completedRuns[action.name] = output;
    }
    Object.entries(output.variables).forEach(([name, value]) => {
      if (isCI) {
        console.log(
          `##vso[task.setvariable variable = ${name}; isOutput = true]${value} `
        );
      }
      console.error(chalk.green(`   - ${name}: ${value} `));
    });
  }
}

function calculateParallization(job) {
  if (!job.module.maxParallelization) {
    return { enabled: false };
  }
  const maxJobs = job.module.maxParallelization;

  if (isCI) {
    const { SYSTEM_JOBPOSITIONINPHASE, SYSTEM_TOTALJOBSINPHASE } = process.env;
    if (!SYSTEM_JOBPOSITIONINPHASE || !SYSTEM_TOTALJOBSINPHASE) {
      console.error(
        chalk.yellow(
          `Expected these environment to have positive values, but they didn't: ${JSON.stringify(
            { SYSTEM_JOBPOSITIONINPHASE, SYSTEM_TOTALJOBSINPHASE }
          )}`
        )
      );
    }
    return {
      enabled: true,
      jobNumber: SYSTEM_JOBPOSITIONINPHASE || 1,
      totalJobs: SYSTEM_TOTALJOBSINPHASE || 1,
      maxJobs,
    };
  } else {
    const jobNumber = argv["job-number"];
    if (!jobNumber) {
      return { enabled: false, maxJobs };
    }
    return {
      enabled: true,
      jobNumber,
      totalJobs: maxJobs,
      maxJobs,
    };
  }
}
