export const issuesQuery = `
query issuesList($owner: String!, $name: String!, $cursor: String = null){
  repository(owner: $owner, name: $name){
    issues(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
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
