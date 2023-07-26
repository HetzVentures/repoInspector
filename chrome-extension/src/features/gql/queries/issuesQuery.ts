import { gql } from 'graphql-tag';
import { print } from 'graphql';

export const query = gql`
  query issuesQuery($owner: String!, $name: String!, $cursor: String = null) {
    repository(owner: $owner, name: $name) {
      issues(
        first: 100
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
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

export const issuesQuery = print(query);
