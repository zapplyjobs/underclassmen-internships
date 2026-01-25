/**
 * ARCHIVED: 2026-01-20
 * Reason: Duplicate function declarations removed during Discord overhaul
 * Original location: .github/scripts/enhanced-discord-bot.js (lines 266-348)
 *
 * These functions were duplicates of imports from poster.js, causing SyntaxError.
 * Removed in commits: 96b645371, 9216af01b
 *
 * Total removed: 164 lines
 * - generateTags: 83 lines (removed in 96b645371)
 * - buildJobEmbed: 52 lines (removed in 9216af01b)
 * - buildActionRow: 17 lines (removed in 9216af01b)
 *
 * All three functions now used exclusively from poster.js imports (line 27).
 * Preserved here for reference.
 */

// Enhanced tag generation
function generateTags(job) {
  const tags = [];
  const title = job.job_title.toLowerCase();
  const description = (job.job_description || '').toLowerCase();
  const company = job.employer_name;

  // Experience level tags
  if (title.includes('senior') || title.includes('sr.') || title.includes('staff') || title.includes('principal')) {
    tags.push('Senior');
  } else if (title.includes('junior') || title.includes('jr.') || title.includes('entry') ||
             title.includes('new grad') || title.includes('graduate')) {
    tags.push('EntryLevel');
  } else {
    tags.push('MidLevel');
  }

  // Location tags
  if (description.includes('remote') || title.includes('remote') ||
      (job.job_city && job.job_city.toLowerCase().includes('remote'))) {
    tags.push('Remote');
  }

  // Add major city tags
  const majorCities = {
    'san francisco': 'SF', 'sf': 'SF', 'bay area': 'SF',
    'new york': 'NYC', 'nyc': 'NYC', 'manhattan': 'NYC',
    'seattle': 'Seattle', 'bellevue': 'Seattle', 'redmond': 'Seattle',
    'austin': 'Austin', 'los angeles': 'LA', 'la': 'LA',
    'boston': 'Boston', 'chicago': 'Chicago', 'denver': 'Denver'
  };

  const cityKey = (job.job_city || '').toLowerCase();
  if (majorCities[cityKey]) {
    tags.push(majorCities[cityKey]);
  }

  // Company tier tags
  if (companies.faang_plus.some(c => c.name === company)) {
    tags.push('FAANG');
  } else if (companies.unicorn_startups.some(c => c.name === company)) {
    tags.push('Unicorn');
  } else if (companies.fintech.some(c => c.name === company)) {
    tags.push('Fintech');
  } else if (companies.gaming.some(c => c.name === company)) {
    tags.push('Gaming');
  }

  // Technology/skill tags
  const techStack = {
    'react': 'React', 'vue': 'Vue', 'angular': 'Angular',
    'node': 'NodeJS', 'python': 'Python', 'java': 'Java',
    'javascript': 'JavaScript', 'typescript': 'TypeScript',
    'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP', 'cloud': 'Cloud',
    'kubernetes': 'K8s', 'docker': 'Docker', 'terraform': 'Terraform',
    'machine learning': 'ML', 'ai': 'AI', 'data science': 'DataScience',
    'ios': 'iOS', 'android': 'Android', 'mobile': 'Mobile',
    'frontend': 'Frontend', 'backend': 'Backend', 'fullstack': 'FullStack',
    'devops': 'DevOps', 'security': 'Security', 'blockchain': 'Blockchain'
  };

  const searchText = `${title} ${description}`;
  for (const [keyword, tag] of Object.entries(techStack)) {
    if (searchText.includes(keyword)) {
      tags.push(tag);
    }
  }

  // Role category tags (only if not already added via tech stack)
  if (!tags.includes('DataScience') && (title.includes('data scientist') || title.includes('analyst'))) {
    tags.push('DataScience');
  }
  if (!tags.includes('ML') && (title.includes('machine learning') || title.includes('ml engineer'))) {
    tags.push('ML');
  }
  if (title.includes('product manager') || title.includes('pm ')) {
    tags.push('ProductManager');
  }
  if (title.includes('designer') || title.includes('ux') || title.includes('ui')) {
    tags.push('Design');
  }

  return [...new Set(tags)]; // Remove duplicates
}

// Enhanced embed builder with auto-generated tags
function buildJobEmbed(job) {
  const tags = generateTags(job);
  const company = companies.faang_plus.find(c => c.name === job.employer_name) ||
                  companies.unicorn_startups.find(c => c.name === job.employer_name) ||
                  companies.fintech.find(c => c.name === job.employer_name) ||
                  companies.gaming.find(c => c.name === job.employer_name) ||
                  companies.top_tech.find(c => c.name === job.employer_name) ||
                  companies.enterprise_saas.find(c => c.name === job.employer_name);

  // Build title - only use company emoji if company is found
  // Note: Don't include emoji in title for forum posts as Discord handles it differently
  const title = job.job_title;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setURL(sanitizeUrl(job.job_apply_link))
    .setColor(0x00A8E8)
    .addFields(
      { name: '🏢 Company', value: job.employer_name || 'Not specified', inline: true },
      {
        name: '📍 Location',
        value: job._multipleLocations && job._multipleLocations.length > 1
          ? job._multipleLocations.map(loc => loc.charAt(0).toUpperCase() + loc.slice(1)).join(', ')
          : (job.job_city && job.job_city.toLowerCase() === 'remote')
            ? 'Remote'
            : `${job.job_city || 'Not specified'}, ${job.job_state || 'Remote'}`,
        inline: true
      },
      { name: '💰 Posted', value: formatPostedDate(job.job_posted_at_datetime_utc), inline: true }
    );

  // Add tags field with hashtag formatting
  if (tags.length > 0) {
    embed.addFields({
      name: '🏷️ Tags',
      value: tags.map(tag => `#${tag}`).join(' '),
      inline: false
    });
  }

  // Add cleaned description preview if available
  const cleanedDescription = cleanJobDescription(job.job_description, job.description_format);
  if (cleanedDescription) {
    embed.addFields({
      name: '📋 Description',
      value: cleanedDescription,
      inline: false
    });
  }

  return embed;
}

// Build action row with apply button and subscription toggle
function buildActionRow(job) {
  const tags = generateTags(job);

  const row = new ActionRowBuilder();

  // Only add subscription button if not in GitHub Actions
  if (!process.env.GITHUB_ACTIONS) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`subscribe_${tags[0] || 'general'}`)
        .setLabel('🔔 Get Similar Jobs')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

module.exports = { generateTags, buildJobEmbed, buildActionRow };
