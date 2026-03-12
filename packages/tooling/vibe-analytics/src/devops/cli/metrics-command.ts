import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { GitHubClient } from "../client/github-client.js";
import { MetricsEngine } from "../engine/metrics-engine.js";
import { z } from "zod";
import { execGitCommand } from "../../utils/exec-helper.js";

function getRepoFromGitConfig(): { owner: string; repo: string } | null {
  try {
    const url = execGitCommand(["config", "--get", "remote.origin.url"]);
    if (!url) return null;

    // Match SSH: git@github.com:owner/repo.git
    // Match HTTPS: https://github.com/owner/repo.git
    const match = url.match(/[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export const metricsCommand = new Command("metrics")
  .description("Analyze DevOps and Engineering metrics (DORA, Cycle Time)")
  .option("-o, --owner <owner>", "Repository owner (e.g. facebook)")
  .option("-r, --repo <repo>", "Repository name (e.g. react)")
  .option("-d, --days <days>", "Analysis period in days", "30")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      // Validate inputs
      const schema = z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        days: z.coerce.number().min(1).max(365),
        json: z.boolean().optional(),
      });

      // Attempt to infer owner/repo from git config if not provided
      if (!options.owner || !options.repo) {
        const detected = getRepoFromGitConfig();
        if (detected) {
          if (!options.owner) options.owner = detected.owner;
          if (!options.repo) options.repo = detected.repo;
          if (!options.json) {
             console.log(chalk.gray(`ℹ️  Auto-detected repository: ${options.owner}/${options.repo}`));
          }
        }
      }

      if (!options.owner || !options.repo) {
          console.error(chalk.red("Error: --owner and --repo are required and could not be auto-detected."));
          process.exit(1);
      }

      const params = schema.parse(options);

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        console.error(chalk.red("Error: GITHUB_TOKEN environment variable is required"));
        console.log(chalk.yellow("Please set it with: export GITHUB_TOKEN=your_token"));
        process.exit(1);
      }

      const client = new GitHubClient(token);
      const engine = new MetricsEngine();

      if (!params.json) {
        console.log(chalk.blue(`\n📊 Analyzing ${params.owner}/${params.repo} for the last ${params.days} days...\n`));
      }

      const data = await client.fetchRepoData(params.owner, params.repo, params.days);
      const report = engine.calculate(data, params.days);

      if (params.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        // DORA Table
        const doraTable = new Table({
            head: [chalk.bold('DORA Metric'), chalk.bold('Value'), chalk.bold('Rating')],
            style: { head: ['cyan'] }
        });

        doraTable.push(
            [
                'Deployment Frequency',
                `${report.dora.deploymentFrequency.value} / day`,
                colorizeRating(report.dora.deploymentFrequency.rating!)
            ],
            [
                'Lead Time for Changes',
                `${report.dora.leadTimeForChanges.value} days`,
                colorizeRating(report.dora.leadTimeForChanges.rating!)
            ],
            [
                'Change Failure Rate',
                `${report.dora.changeFailureRate.value}%`,
                colorizeRating(report.dora.changeFailureRate.rating!)
            ]
        );

        console.log(chalk.bold.underline('🚀 DORA Metrics'));
        console.log(doraTable.toString());
        console.log('');

        // Velocity Table
        const velocityTable = new Table({
            head: [chalk.bold('Velocity Metric'), chalk.bold('Median Value')],
            style: { head: ['magenta'] }
        });

        velocityTable.push(
            ['Cycle Time', `${report.velocity.cycleTime.value} hours`],
            ['PR Pickup Time', `${report.velocity.prPickupTime.value} hours`],
            ['PR Review Time', `${report.velocity.prReviewTime.value} hours`],
            ['PR Merge Time', `${report.velocity.prMergeTime.value} hours`],
            ['PR Size', `${report.velocity.prSize.value} lines`]
        );

        console.log(chalk.bold.underline('⚡ Engineering Velocity'));
        console.log(velocityTable.toString());
        console.log('');
      }

    } catch (error: unknown) {
      console.error(chalk.red("Analysis Failed:"), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function colorizeRating(rating: 'Elite' | 'High' | 'Medium' | 'Low'): string {
    switch (rating) {
        case 'Elite': return chalk.green.bold(rating);
        case 'High': return chalk.green(rating);
        case 'Medium': return chalk.yellow(rating);
        case 'Low': return chalk.red(rating);
        default: return rating;
    }
}
