function getPathFromUrl(url: string) {
  const re = /^(?:https?:\/\/)?(?:[^\n@]+@)?(?:www\.)?([^\n/:?]+)/gim;
  const path = url.replace(re, "");
  return path || "/";
}

export const getRequestedUrl = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return getPathFromUrl(url);
  }
  return url;
};
