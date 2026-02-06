export interface GitHubUser {
  login: string;
  name: string;
  id: string;
}

export interface GitHubProjectV2 {
  id: string;
  title: string;
  number: number;
  url: string;
}

export interface GitHubViewerResponse {
  data: {
    viewer: {
      login: string;
      name: string;
      id: string;
    };
  };
  errors?: {
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[];
    type?: string;
  }[];
}

export interface GitHubProjectsResponse {
  data: {
    viewer: {
      projectsV2: {
        nodes: GitHubProjectV2[];
      };
    };
    organization?: {
      projectsV2: {
        nodes: GitHubProjectV2[];
      };
    };
  };
}
