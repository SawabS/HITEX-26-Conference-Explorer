/** Prefix public assets and native history URLs for repository hosting. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const publicAsset = (path: string): string => `${BASE_PATH}${path}`;
