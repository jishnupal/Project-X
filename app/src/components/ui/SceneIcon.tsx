type SceneIconProps = {
  className?: string;
};

/** Two lenses. Reads as a look across the day at nav size. */
export function SceneIcon({ className }: SceneIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7 8.2a5 5 0 1 0 .01 10 5 5 0 0 0-.01-10zm0 2.1a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M17 8.2a5 5 0 1 0 .01 10 5 5 0 0 0-.01-10zm0 2.1a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8z"
      />
      <path fill="currentColor" d="M10.6 12.2h2.8v2.1h-2.8z" />
      <path
        fill="currentColor"
        d="M4.6 5.2h4.2c.4 0 .7.3.7.7v1.5c0 .7-.8 1.1-1.6 1.4-.6.2-1.2.3-1.2.3s-.6-.1-1.2-.3C4.7 8.5 3.9 8.1 3.9 7.4V5.9c0-.4.3-.7.7-.7z"
      />
      <path
        fill="currentColor"
        d="M15.2 5.2h4.2c.4 0 .7.3.7.7v1.5c0 .7-.8 1.1-1.6 1.4-.6.2-1.2.3-1.2.3s-.6-.1-1.2-.3c-.8-.3-1.6-.7-1.6-1.4V5.9c0-.4.3-.7.7-.7z"
      />
    </svg>
  );
}
