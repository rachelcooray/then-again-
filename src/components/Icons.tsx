const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
  'aria-hidden': true,
};

export const TodayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M3 11l9-7 9 7v9H3z" /></svg>
);
export const LibraryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 5h6v14H4zM14 5h6v14h-6z" /></svg>
);
export const ThemesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M12 3l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 17l8 4 8-4" /></svg>
);
export const CollectionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
);
export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M15 5l-7 7 7 7" /></svg>
);
export const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);
export const GemIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path d="M14 6h20l10 12-20 24L4 18z" fill="#E8552B" />
  </svg>
);
export const BigGemIcon = () => (
  <svg width="56" height="56" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M14 6h20l10 12-20 24L4 18z" fill="#E8552B" />
    <path d="M4 18h40M14 6l10 36M34 6L24 42M14 6l-2 12M34 6l2 12" stroke="#141210" strokeWidth="2" fill="none" strokeLinejoin="round" />
  </svg>
);
