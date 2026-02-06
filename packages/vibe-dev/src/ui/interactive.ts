import inquirer from 'inquirer';
import { SyncCommandConfig } from '../commands/sync.command';
import { SyncAction } from '../types/sync.types';

export async function promptForConfig(initialConfig: Partial<SyncCommandConfig>): Promise<SyncCommandConfig> {
  const questions = [];

  if (!initialConfig.githubToken) {
    questions.push({
      type: 'password',
      name: 'githubToken',
      message: 'GitHub Personal Access Token:',
      validate: (input: string) => input.length > 0 || 'Token is required',
    });
  }

  if (!initialConfig.owner) {
    questions.push({
      type: 'input',
      name: 'owner',
      message: 'GitHub Owner (User or Organization):',
      validate: (input: string) => input.length > 0 || 'Owner is required',
    });
  }

  if (initialConfig.isOrg === undefined) {
    questions.push({
      type: 'confirm',
      name: 'isOrg',
      message: 'Is this an Organization?',
      default: false,
    });
  }

  if (!initialConfig.projectNumber) {
    questions.push({
      type: 'number',
      name: 'projectNumber',
      message: 'Project V2 Number:',
      validate: (input: number) => !isNaN(input) && input > 0 || 'Valid Project Number is required',
    });
  }

  if (!initialConfig.localPath) {
    questions.push({
      type: 'input',
      name: 'localPath',
      message: 'Local JSON File Path:',
      default: 'vibe-tasks.json',
      validate: (input: string) => input.length > 0 || 'Path is required',
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    ...initialConfig,
    ...answers,
    // Ensure types are correct if they came from prompts
    projectNumber: Number(answers.projectNumber || initialConfig.projectNumber),
  } as SyncCommandConfig;
}

export async function resolveConflicts(conflicts: SyncAction[]): Promise<SyncAction[]> {
  const resolvedActions: SyncAction[] = [];

  console.log(`\n⚠️  Found ${conflicts.length} conflicts. Please resolve them:\n`);

  for (const conflict of conflicts) {
    const choices = [
      { name: 'Keep Remote Version (Pull)', value: 'pull' },
      { name: 'Keep Local Version (Push)', value: 'push' },
      { name: 'Skip', value: 'none' }
    ];

    const message = `Conflict in task "${conflict.localTask?.title || conflict.remoteTask?.title || 'Unknown'}" (${conflict.reason})`;

    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'resolution',
      message: message,
      choices: choices
    }]);

    // Update the action type based on user choice
    // We clone the conflict to avoid mutating the original array unexpectedly (though here it's fine)
    resolvedActions.push({
      ...conflict,
      type: answer.resolution
    });
  }

  return resolvedActions;
}
