export const layoutName = (fav) => {
  if (!fav.trackParentId) return null;
  let name = fav.trackName || '';
  const parent = fav.parentTrackName || '';
  if (parent && name.startsWith(parent)) {
    const stripped = name.substring(parent.length)
      .replace(/^[\s\-—/()]+|[\s)]+$/g, '').trim();
    if (stripped) return stripped;
  }
  if (name && name !== parent) return name;
  if (fav.trackSubPath) {
    return fav.trackSubPath.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
};
