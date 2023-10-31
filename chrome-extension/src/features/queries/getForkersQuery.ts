export const getForkersQuery = (limit: number): string => `
query forkersList($owner: String!, $name: String!, $cursor: String = null){
  repository(owner: $owner, name: $name){
    forks(first: ${limit}, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
      edges {
        node {
          owner {
            ... on User {
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
