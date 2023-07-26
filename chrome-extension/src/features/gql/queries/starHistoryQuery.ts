import { gql } from 'graphql-tag';
import { print } from 'graphql';

export const query = gql`
  query starHistoryQuery(
    $owner: String!
    $name: String!
    $cursor: String = null
  ) {
    repository(owner: $owner, name: $name) {
      stargazers(
        first: 100
        after: $cursor
        orderBy: { field: STARRED_AT, direction: DESC }
      ) {
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

export const starHistoryQuery = print(query);
