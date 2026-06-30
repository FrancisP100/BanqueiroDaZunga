export function BciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src="/Logo1.png"
        alt="BCI Logo"
        className="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  );
}
