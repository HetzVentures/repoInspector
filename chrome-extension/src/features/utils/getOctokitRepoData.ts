export const getOctokitRepoData = (
  repoUrl: string,
): { owner: string; name: string } => {
  const urlParts = repoUrl.split('/');
  const owner = urlParts[3] ?? '';
  const name = urlParts[4] ?? '';

  return { owner, name };
};
