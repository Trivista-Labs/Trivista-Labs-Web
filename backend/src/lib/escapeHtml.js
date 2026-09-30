const REPLACEMENTS = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
});

/**
 * Escape a value for safe interpolation into HTML text or a quoted attribute.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (char) => REPLACEMENTS[char]);
}

module.exports = { escapeHtml };
