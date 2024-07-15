const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_OWNER = 'raimonika20';
const REPO_NAME = 'update-style-version';
const PR_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=open`;
const STYLE_CSS_PATH = path.join(__dirname, 'style.css');

function getBranchName() {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
}

function getLatestCommitHash() {
    const latestCommitHash = execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
    console.log(`Latest commit hash: ${latestCommitHash}`);
    return latestCommitHash;
}

async function getPRIDForCommit(commitHash) {
    const response = await axios.get(PR_API_URL);
    const prs = response.data;

    for (const pr of prs) {
        const prCommitsResponse = await axios.get(pr.commits_url);
        const prCommits = prCommitsResponse.data;

        for (const commit of prCommits) {
            if (commit.sha.startsWith(commitHash)) {
                return pr.number;
            }
        }
    }
    return null; 
}

async function updateVersion() {
    try {
        const branchName = getBranchName();
        // console.log(`Current Branch: ${branchName}`);
        const latestCommitHash = await getLatestCommitHash(branchName);
        const prID = await getPRIDForCommit(latestCommitHash);

        if (!prID) {
            throw new Error('No PR found for the latest commit.');
        }

        let styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');

        styleCss = styleCss.replace(
            /(Version:\s*\d+\.\d+\.\d+)(-\w+-\w+)?/,
            `Version: 1.18.0-pr${prID}-${latestCommitHash}`
        );

        fs.writeFileSync(STYLE_CSS_PATH, styleCss, 'utf8');

        console.log('style.css updated successfully.');
    } catch (error) {
        console.error('Error updating style.css:', error);
    }
}

updateVersion();
