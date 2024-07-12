const axios = require('axios');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'raimonika20';
const REPO_NAME = 'update-style-version';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits`;
const PR_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`;
const STYLE_CSS_PATH = path.join(__dirname, 'style.css');

async function getLatestCommitHash() {
    const response = await axios.get(GITHUB_API_URL);
    return response.data[0].sha.substring(0, 7);
}

async function getLatestPRID(commitHash) {
    const response = await axios.get(PR_API_URL);
    const prs = response.data;
    for (const pr of prs) {
        const prCommits = await axios.get(pr.commits_url);
        if (prCommits.data.some(commit => commit.sha.startsWith(commitHash))) {
            return pr.number;
        }
    }
    throw new Error('No PR found for the latest commit.');
}

async function updateVersion() {
    try {
        const latestCommitHash = await getLatestCommitHash();
        const latestPRID = await getLatestPRID(latestCommitHash);

        let styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');

        styleCss = styleCss.replace(/(\* Version:\s*\d+\.\d+\.\d+)(-\w+)?/, (match, p1) => {
            return `${p1}-pr${latestPRID}-${latestCommitHash}`;
        });

        fs.writeFileSync(STYLE_CSS_PATH, styleCss, 'utf8');

        console.log('style.css updated successfully.');
    } catch (error) {
        console.error('Error updating style.css:', error);
    }
}

updateVersion();
