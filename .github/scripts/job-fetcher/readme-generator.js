const path = require("path");
const config = require(path.join(process.cwd(), '.github/scripts/job-fetcher/config.js'));
const jobCategories = require(path.join(process.cwd(), '.github/scripts/job-fetcher/job_categories.json'));
const { createReadmeGenerator } = require(path.join(__dirname, '../shared/lib/readme-generator.js'));
module.exports = createReadmeGenerator(config, jobCategories, process.cwd());
