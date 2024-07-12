const axios = require('axios');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'raimonika20';
const REPO_NAME = 'update-style-version';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits`;
const PR_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=open`;
const STYLE_CSS_PATH = path.join(__dirname, 'style.css');

async function getLatestCommitHash() {
    const response = await axios.get(GITHUB_API_URL);
    const latestCommitHash = response.data[0].sha.substring(0, 7);
    console.log(`Latest commit hash: ${latestCommitHash}`);
    return latestCommitHash;
}

async function getPRIDForCommit(commitHash) {
    const response = await axios.get(PR_API_URL);
    const prs = response.data;

    for (const pr of prs) {
        console.log(`Checking PR #${pr.number} - ${pr.title}`);
        const prCommitsResponse = await axios.get(pr.commits_url);
        const prCommits = prCommitsResponse.data;

        for (const commit of prCommits) {
            console.log(`Checking commit: ${commit.sha}`);
            if (commit.sha.startsWith(commitHash)) {
                console.log(`Found matching PR #${pr.number} for commit ${commitHash}`);
                return pr.number;
            }
        }
    }
    return null; // Return null if no matching PR is found
}

async function updateVersion() {
    try {
        const latestCommitHash = await getLatestCommitHash();
        const prID = await getPRIDForCommit(latestCommitHash);

        if (!prID) {
            throw new Error('No PR found for the latest commit.');
        }

        let styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');

        styleCss = styleCss.replace(/(Version:\s*\d+\.\d+\.\d+)(-\w+)?/, (match, p1) => {
            return `${p1}-pr${prID}-${latestCommitHash}`;
        });

        fs.writeFileSync(STYLE_CSS_PATH, styleCss, 'utf8');

        console.log('style.css updated successfully.');
    } catch (error) {
        console.error('Error updating style.css:', error);
    }
}

updateVersion();
