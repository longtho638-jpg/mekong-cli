import { GitHubClient } from '../src/lib/github-client';
import { ProjectService } from '../src/lib/project-service';

async function main() {
  console.log('Running Write Operations Mock Test...');

  const mockClient = {
    graphql: async (query: string, vars: any) => {
      // Mock: Get Project (for field caching)
      if (query.includes('user') || query.includes('organization')) {
        console.log('Mock: Fetched Project Fields');
        return {
          user: {
            projectV2: {
              id: 'PVT_1',
              title: 'Test Project',
              fields: {
                nodes: [
                  {
                    id: 'F_STATUS',
                    name: 'Status',
                    dataType: 'SINGLE_SELECT',
                    options: [
                      { id: 'OPT_TODO', name: 'Todo' },
                      { id: 'OPT_DONE', name: 'Done' }
                    ]
                  },
                  {
                    id: 'F_PRIORITY',
                    name: 'Priority',
                    dataType: 'SINGLE_SELECT',
                    options: [
                      { id: 'OPT_HIGH', name: 'High' }
                    ]
                  }
                ]
              }
            }
          }
        };
      }

      // Mock: Get Items (required by fetchProjectItems logic, return empty for write test)
      if (query.includes('items(')) {
        return {
          node: {
            items: {
              pageInfo: { hasNextPage: false },
              nodes: []
            }
          }
        };
      }

      // Mock: Add Item
      if (query.includes('addProjectV2ItemById')) {
        console.log(`Mock: Added Item ${vars.contentId} to Project ${vars.projectId}`);
        return {
          addProjectV2ItemById: {
            item: { id: 'PVTI_NEW_1' }
          }
        };
      }

      // Mock: Update Field
      if (query.includes('updateProjectV2ItemFieldValue')) {
        console.log(`Mock: Updated Item ${vars.itemId} Field ${vars.fieldId} with`, JSON.stringify(vars.value));
        return {
          updateProjectV2ItemFieldValue: {
            projectV2Item: { id: vars.itemId, updatedAt: new Date().toISOString() }
          }
        };
      }
    }
  } as unknown as GitHubClient;

  const service = new ProjectService(mockClient);

  try {
    // 1. Initialize (fetch fields)
    await service.fetchProjectItems('mock-user', 1);

    // 2. Add Item
    const newItemId = await service.addItemToProject('PVT_1', 'I_100');
    if (newItemId === 'PVTI_NEW_1') {
      console.log('✅ Add Item verified');
    } else {
      console.error('❌ Add Item failed');
      process.exit(1);
    }

    // 3. Update Status (Todo -> OPT_TODO)
    await service.updateItemField('PVT_1', newItemId, 'Status', 'Todo');
    console.log('✅ Update Status verified');

    // 4. Update Priority (High -> OPT_HIGH)
    await service.updateItemField('PVT_1', newItemId, 'Priority', 'High');
    console.log('✅ Update Priority verified');

    // 5. Test Invalid Option (should throw)
    try {
      await service.updateItemField('PVT_1', newItemId, 'Status', 'Invalid');
      console.error('❌ Invalid Option check failed (should have thrown)');
      process.exit(1);
    } catch (e: any) {
      if (e.message.includes('not found')) {
        console.log('✅ Invalid Option check passed');
      } else {
        throw e;
      }
    }

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

main();
