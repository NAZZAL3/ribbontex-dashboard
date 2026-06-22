interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export function BrandLogo({ className = 'h-10 w-auto', alt = 'Ribbontex Nazzal' }: BrandLogoProps) {
  return <img src="/logo.png" alt={alt} className={className} />;
}
