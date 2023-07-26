import { gql } from 'graphql-tag';
import { print } from 'graphql';

export const query = gql`
  query repositoryQuery($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      stargazerCount
      stargazers(first: 0) {
        totalCount
      }
      forkCount
      forks(first: 0) {
        totalCount
      }
      issues(first: 0) {
        totalCount
      }
      pullRequests(first: 0) {
        totalCount
      }
      watchers(first: 0) {
        totalCount
      }
    }
    rateLimit {
      cost
      remaining
      resetAt
    }
  }
`;

export const repositoryQuery = print(query);
