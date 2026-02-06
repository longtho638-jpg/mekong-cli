import { GitHubClient } from '../src/lib/github-client';

async function main() {
  console.log('Testing GitHub Connection...');

  try {
    const client = new GitHubClient();
    console.log('Authenticating...');
    await client.authenticate();
    console.log('Authentication successful.');

    console.log('Fetching viewer...');
    const viewer = await client.getViewer();

    console.log('✅ Connected to GitHub successfully!');
    console.log('Viewer Info:');
    console.log(`- Login: ${viewer.login}`);
    console.log(`- Name: ${viewer.name}`);
    console.log(`- ID: ${viewer.id}`);

  } catch (error) {
    console.error('❌ Connection failed:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
