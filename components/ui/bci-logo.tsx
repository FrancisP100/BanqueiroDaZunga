import Image from "next/image";

export function BciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/logo1.png"
        alt="BCI Logo"
        fill
        className="object-contain"
        priority
        quality={100}
        unoptimized
      />
    </div>
  );
}
