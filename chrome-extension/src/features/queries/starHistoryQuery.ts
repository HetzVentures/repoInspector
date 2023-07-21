export const starHistoryQuery = `
query issuesList($owner: String!, $name: String!, $cursor: String = null){
  repository(owner: $owner, name: $name){
    stargazers(first: 100, after: $cursor, orderBy: {field: STARRED_AT, direction: DESC}) {
      totalCount
      edges {
        starredAt
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
