import { GitHubClient } from '../src/lib/github-client';
import { ProjectService } from '../src/lib/project-service';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/test-sync-down.ts <owner> <project-number> [is-org]');
    console.log('Example: npx tsx scripts/test-sync-down.ts octocat 123 false');
    console.log('\nRunning in MOCK mode for logic verification...');
    await runMockTest();
    return;
  }

  const [owner, projectNumberStr, isOrgStr] = args;
  const projectNumber = parseInt(projectNumberStr, 10);
  const isOrg = isOrgStr === 'true';

  console.log(`Connecting to GitHub Project: ${owner}/${projectNumber} (Org: ${isOrg})...`);

  try {
    const client = new GitHubClient();
    await client.authenticate();

    const service = new ProjectService(client);
    console.log('Fetching items...');
    const tasks = await service.fetchProjectItems(owner, projectNumber, isOrg);

    console.log(`✅ Successfully fetched ${tasks.length} tasks.`);
    if (tasks.length > 0) {
      console.log('Sample Task:', JSON.stringify(tasks[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

async function runMockTest() {
  // Mock Client
  const mockClient = {
    graphql: async (query: string, vars: any) => {
      console.log('Mock GraphQL call:', query.includes('user') ? 'Get Project' : 'Get Items');

      if (query.includes('user')) {
        return {
          user: {
            projectV2: {
              id: 'PVT_kw123',
              title: 'Mock Project',
              number: 1,
              fields: { nodes: [] }
            }
          }
        };
      }

      if (query.includes('node')) {
        return {
          node: {
            items: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  id: 'PVTI_123',
                  type: 'ISSUE',
                  content: {
                    id: 'I_123',
                    title: 'Fix Login Bug',
                    body: 'Login fails on Safari',
                    number: 42,
                    url: 'https://github.com/octocat/repo/issues/42',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    state: 'OPEN',
                    assignees: { nodes: [{ login: 'dev1' }] },
                    labels: { nodes: [{ name: 'bug' }] }
                  },
                  fieldValues: {
                    nodes: [
                      { name: 'Todo', field: { name: 'Status' } },
                      { name: 'High', field: { name: 'Priority' } }
                    ]
                  }
                }
              ]
            }
          }
        };
      }
    }
  } as unknown as GitHubClient;

  const service = new ProjectService(mockClient);
  const tasks = await service.fetchProjectItems('mock-owner', 1);

  console.log('Mapped Tasks:', JSON.stringify(tasks, null, 2));

  const t = tasks[0];
  if (t.title === 'Fix Login Bug' && t.status === 'pending' && t.priority === 'high' && t.assignee === 'dev1') {
    console.log('✅ Mock verification passed: Mapping logic is correct.');
  } else {
    console.error('❌ Mock verification failed: Mapping mismatch.');
    process.exit(1);
  }
}

main();
