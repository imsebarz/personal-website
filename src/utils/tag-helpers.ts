/**
 * Utility functions for processing workspace and tag names
 */

/**
 * Converts a workspace name to a valid Todoist label
 * @param workspaceName - The original workspace name from Notion
 * @returns A sanitized label name suitable for Todoist
 */
export function createWorkspaceTag(workspaceName: string): string {
  return workspaceName
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-z0-9\-_]/g, '')   // Remove invalid characters, keep letters, numbers, hyphens, underscores
    .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
    .substring(0, 50);              // Todoist label limit is 100 chars, being conservative
}

/**
 * Combines base tags with workspace tag, ensuring no duplicates
 * @param baseTags - Original tags from AI or default
 * @param workspaceTag - Sanitized workspace tag
 * @returns Array of unique tags
 */
export function combineTagsWithWorkspace(baseTags: string[], workspaceTag: string): string[] {
  const allTags = [...baseTags];
  
  // Only add workspace tag if it's not already present and is valid
  if (workspaceTag && !allTags.includes(workspaceTag)) {
    allTags.push(workspaceTag);
  }
  
  return allTags;
}
