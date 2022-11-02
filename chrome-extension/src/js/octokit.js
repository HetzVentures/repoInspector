const { Octokit } = require("@octokit/core");

let octokit;
export function initOctokit(accessToken) {
    // initialize octokit instance
    octokit = new Octokit({ auth: accessToken });
    return octokit
}
