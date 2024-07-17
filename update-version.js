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

async function getCommits(prCommitsUrl) {
    const perPage = 100;
    let page = 1;
    let allCommits = [];

    while (true) {
        const { data: commits } = await axios.get(`${prCommitsUrl}?per_page=${perPage}&page=${page}`);
        if (commits.length === 0) break;
        allCommits = allCommits.concat(commits);
        page++;
    }

    return allCommits;
}

async function getPRIDForCommit(commitHash) {
    try {
        const response = await axios.get(PR_API_URL);
        const prs = response.data;

        for (const pr of prs) {
            const prCommits = await getCommits(pr.commits_url);

            for (const commit of prCommits) {
                if (commit.sha.startsWith(commitHash)) {
                    console.log(`Match found in PR #${pr.number}`);
                    return pr.number;
                }
            }
        }

        console.log('No matching PR found for the commit hash.');
        return null;
    } catch (error) {
        console.error('Error fetching PRs:', error.message);
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
