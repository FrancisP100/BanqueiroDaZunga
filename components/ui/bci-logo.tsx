import Image from "next/image";

export function BciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/Logo1.png"
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
