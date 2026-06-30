export function BciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src="/logo.png"
        alt="BCI Logo"
        className="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  );
}
