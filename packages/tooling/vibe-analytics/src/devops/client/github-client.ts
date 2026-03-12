import { Octokit } from "octokit";
import { paginateGraphql } from "@octokit/plugin-paginate-graphql";
import { GraphqlResponseError } from "@octokit/graphql";
import { GraphQLRepositoryResponse, RepoMetricsData } from "../types/github.js";

const MyOctokit = Octokit.plugin(paginateGraphql as any);

export class GitHubClient {
  private octokit: InstanceType<typeof MyOctokit>;

  constructor(token: string) {
    this.octokit = new MyOctokit({ auth: token });
  }

  async fetchRepoData(owner: string, repo: string, days = 90): Promise<RepoMetricsData> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceIso = sinceDate.toISOString();

    console.log(`Fetching data for ${owner}/${repo} since ${sinceIso}...`);

    try {
      // Fetch Pull Requests
      const prData = await (this.octokit.graphql as any).paginate(
        `
        query($owner: String!, $repo: String!, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            pullRequests(first: 100, states: [MERGED], orderBy: {field: CREATED_AT, direction: DESC}, after: $cursor) {
              nodes {
                number
                title
                state
                createdAt
                mergedAt
                closedAt
                additions
                deletions
                url
                author {
                  login
                }
                commits(first: 1) {
                  nodes {
                    commit {
                      committedDate
                    }
                  }
                }
                reviews(first: 10) {
                  nodes {
                    createdAt
                    state
                    author {
                      login
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
        `,
        {
          owner,
          repo,
        }
      ) as GraphQLRepositoryResponse;

      // Fetch Releases
      const releaseData = await (this.octokit.graphql as any).paginate(
        `
        query($owner: String!, $repo: String!, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            releases(first: 100, orderBy: {field: CREATED_AT, direction: DESC}, after: $cursor) {
              nodes {
                name
                tagName
                createdAt
                publishedAt
                isPrerelease
                isDraft
                url
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
        `,
        {
          owner,
          repo,
        }
      ) as GraphQLRepositoryResponse;

      // Filter by date (client-side filtering as GraphQL filter support varies)
      // Note: We fetch loosely based on count/pagination but strict filter here
      // Ideally we would stop pagination when we hit the date, but for simplicity we fetch a reasonable batch
      // For a robust implementation, the paginate loop should check the date.
      // However, octokit paginate fetches *all* by default or until callback stops it.
      // To keep it simple for now, we'll assume the default pagination behavior (fetching all or reasonable limit)
      // and filter here. A more optimized version would use an iterator.

      const pullRequests = (prData.repository?.pullRequests?.nodes || []).filter(
        (pr) => new Date(pr.createdAt as string) >= sinceDate
      );

      const releases = (releaseData.repository?.releases?.nodes || []).filter(
        (rel) => new Date(rel.createdAt as string) >= sinceDate
      );

      return {
        pullRequests,
        releases,
      };

    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        console.error("GraphQL Error:", error.message);
      }
      throw error;
    }
  }
}
