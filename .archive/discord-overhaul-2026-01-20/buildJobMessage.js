/**
 * ARCHIVED: 2026-01-20
 * Reason: Switched from text+embed to embed-only messages
 * Original location: .github/scripts/src/discord/poster.js
 *
 * This function built the text message content that was sent alongside embeds.
 * We removed it to avoid duplicate content (text + embed showing same info).
 *
 * Preserved here for reference in case we need to revert or reference the format.
 */

/**
 * Build formatted text message for Discord
 * @param {Object} job - Job object
 * @returns {string} Formatted message text
 */
function buildJobMessage(job) {
  const emoji = getJobEmoji(job);
  const location = formatLocation(job);
  const tags = generateTags(job);

  // Build preview message with emojis and formatting
  let message = `${emoji} **${job.job_title}** @ **${job.employer_name}**\n\n`;
  message += `📍 ${location} | 💰 ${formatPostedDate(job.job_posted_at_datetime_utc)}\n`;

  // Add tags
  if (tags.length > 0) {
    message += `🏷️ ${tags.map(tag => `#${tag}`).join(' ')}\n`;
  }

  message += `\n`;

  // Add description preview (cleaned and truncated)
  const cleanedDescription = cleanJobDescription(job.job_description, job.description_format);
  if (cleanedDescription) {
    message += `${cleanedDescription}\n\n`;
  }

  // Add apply link
  const applyLink = sanitizeUrl(job.job_apply_link);
  message += `🔗 [Apply Now](${applyLink})`;

  return message;
}

module.exports = { buildJobMessage };
