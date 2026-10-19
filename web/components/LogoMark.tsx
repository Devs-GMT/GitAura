// Mark GitAura: tile tinta membulat + kilau 4 sudut pink (aura) + kilau kecil kuning. Sama dengan app/icon.svg.
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#111111" />
      <path d="M15 8C15.8 13.4 18.6 16.2 24 17C18.6 17.8 15.8 20.6 15 26C14.2 20.6 11.4 17.8 6 17C11.4 16.2 14.2 13.4 15 8Z" fill="#E83AD6" />
      <path d="M23.5 5C23.8 7.2 24.8 8.2 27 8.5C24.8 8.8 23.8 9.8 23.5 12C23.2 9.8 22.2 8.8 20 8.5C22.2 8.2 23.2 7.2 23.5 5Z" fill="#F6C945" />
    </svg>
  );
}
