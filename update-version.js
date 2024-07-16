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

// add comment

// add comment2

function getLatestCommitHash() {
    return execSync('git rev-parse HEAD').toString().trim().substring(0, 7);

}

function getGitTag(commitHash) {
    try {
        const tag = execSync(`git tag --points-at ${commitHash}`).toString().trim();
        if (tag) {
            console.log(`Git tag: ${tag}`);
            return tag;
        } else {
            console.log('No tags found.');
            return '';
        }
    } catch (error) {
        console.log('Error fetching tag:', error.message);
        return '';
    }
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
                console.log(`Match found in PR #${pr.number}`);
                return pr.number;
            }
        }
        return null;
    }
}

async function updateVersion() {
    try {
        const branchName = getBranchName();
        console.log(`Current Branch: ${branchName}`);
        const latestCommitHash = getLatestCommitHash();
        console.log(`Current Hash: ${latestCommitHash}`);
        const prID = await getPRIDForCommit(latestCommitHash);
        console.log(`Current PR ID: ${prID}`);
        const gitTag = getGitTag(latestCommitHash);
        console.log(`Current git tag: ${gitTag}`);

        let versionSuffix;
        if (prID) {
            versionSuffix = `pr${prID}-${latestCommitHash}`;
        } else if (gitTag) {
            versionSuffix = `${branchName}-${gitTag}-${latestCommitHash}`;
        } else {
            versionSuffix = `${branchName}-${latestCommitHash}`;
        }

        let styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');

        const versionRegex = /(Version:\s*\d+\.\d+\.\d+)(?:-\S+)?/;
        const newVersionString = `$1-${versionSuffix}`;

        if (versionRegex.test(styleCss)) {
            styleCss = styleCss.replace(versionRegex, newVersionString);
        } else {
            styleCss = styleCss.replace(/(Version:\s*\d+\.\d+\.\d+)/, `$1-${versionSuffix}`);
        }

        fs.writeFileSync(STYLE_CSS_PATH, styleCss, 'utf8');

        console.log('style.css updated successfully.');
    } catch (error) {
        console.error('Error updating style.css:', error);
    }
}

updateVersion();
