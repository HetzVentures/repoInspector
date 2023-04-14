const { Octokit } = require('@octokit/core');

// Initialize octokit instance
const initOctokit = (accessToken) => new Octokit({ auth: accessToken });

export { initOctokit };
