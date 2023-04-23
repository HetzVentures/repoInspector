export const createName = (repo: string) => {
  // remove any parts of url beyond repo name
  const urlParts = repo.split("/");
  return `${urlParts[3]}/${urlParts[4]}`;
};
