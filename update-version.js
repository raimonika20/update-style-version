const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GITHUB_API_URL = 'https://api.github.com/repos/raimonika20/update-style-version/commits';
const STYLE_CSS_PATH = path.join(__dirname, 'style.css');

async function updateVersion() {
    try {
        // Fetch the latest commit hash from GitHub API
        const response = await axios.get(GITHUB_API_URL);
        const latestCommitHash = response.data[0].sha.substring(0, 7); // Get first 7 characters of the hash

        // Read the style.css file
        let styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');

        // Check for existing hash and update the version in style.css
        styleCss = styleCss.replace(/(\* Version:\s*\d+\.\d+\.\d+)(-\w+)?/, (match, p1) => {
            return `${p1}-${latestCommitHash}`;
        });

        // Write the updated style.css back to the file
        fs.writeFileSync(STYLE_CSS_PATH, styleCss, 'utf8');

        console.log('style.css updated successfully.');
    } catch (error) {
        console.error('Error updating style.css:', error);
    }
}

updateVersion();
