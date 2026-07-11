import Image from "next/image";

export function BciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src="/Logo1.png"
        alt="BCI Logo"
        className="h-full w-full object-contain"
        width={200}
        height={60}
        priority
      />
    </div>
  );
}
