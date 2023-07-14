export const pullRequestsQuery = `
query pullRequestsList($owner: String!, $name: String!, $cursor: String = null){
  repository(owner: $owner, name: $name){
    pullRequests(first: 100, after: $cursor, states: CLOSED, orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      edges {
        node {
          createdAt
          closed
          state
          closedAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
  rateLimit {
    cost
    remaining
    resetAt
  }
}
`;
