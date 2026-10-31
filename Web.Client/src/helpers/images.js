// Image URL builders matching /image/{*path} routes on the backend.
// Path segments are URI-encoded - skin/track names can contain #, & etc.
export const skinPreviewUrl = (carPath, skinPath, game = 'assetto corsa') =>
    skinPath ? `/image/${encodeURIComponent(game)}/skin/${encodeURIComponent(carPath)}/${encodeURIComponent(skinPath)}` : '';

export const skinLiveryUrl = (carPath, skinPath, game = 'assetto corsa') =>
    `/image/${encodeURIComponent(game)}/livery/${encodeURIComponent(carPath)}/${encodeURIComponent(skinPath)}`;

export const trackPreviewUrl = (trackPath, subPath) =>
    `/image/assetto corsa/track/${encodeURIComponent(trackPath)}${subPath ? `/${encodeURIComponent(subPath)}` : ''}`;

export const trackOutlineUrl = (trackPath, subPath) =>
    `/image/assetto corsa/track-outline/${encodeURIComponent(trackPath)}${subPath ? `/${encodeURIComponent(subPath)}` : ''}`;

export const flagUrl = (code) => `/images/flags/80x60/${(code || 'unknown').toLowerCase()}.png`;
