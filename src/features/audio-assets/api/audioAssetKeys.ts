export const audioAssetKeys = {
  all: ['audio-library'] as const,
  assets: () => [...audioAssetKeys.all, 'assets'] as const,
  folders: () => [...audioAssetKeys.all, 'folders'] as const,
}
