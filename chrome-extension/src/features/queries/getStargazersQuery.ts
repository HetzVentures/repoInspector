export const getStargazersQuery = (limit: number): string => `
query stargazersList($owner: String!, $name: String!, $cursor: String = null){
  repository(owner: $owner, name: $name){
    stargazers(first: ${limit}, after: $cursor, orderBy: {field: STARRED_AT, direction: DESC}) {
      edges {
        node {
          login
          createdAt
          updatedAt
          name
          location
          __typename
          isSiteAdmin
          company
          bio
          email
          isHireable
          twitterUsername
          websiteUrl
          followers(first: 0) {
            totalCount
          }
          following(first:0){
            totalCount
          }
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
