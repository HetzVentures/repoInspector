import { gql } from 'graphql-tag';
import { print } from 'graphql';

export const query = gql`
  query getForkersQuery(
    $owner: String!
    $name: String!
    $cursor: String = null
    $limit: Int
  ) {
    repository(owner: $owner, name: $name) {
      forks(
        first: $limit
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
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
                following(first: 0) {
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

export const getForkersQuery = print(query);

export const fallbackQuery = gql`
  query getForkersQuery(
    $owner: String!
    $name: String!
    $cursor: String = null
    $limit: Int
  ) {
    repository(owner: $owner, name: $name) {
      forks(
        first: $limit
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

export const getForkersFallbackQuery = print(query);
