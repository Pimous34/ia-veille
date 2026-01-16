'use client';

interface OreegamiaLogoProps {
  className?: string;
}

const OreegamiaLogo = ({ className }: OreegamiaLogoProps) => {
  return (
    <div className={`flex flex-col items-center select-none ${className ?? ''}`}>
      <svg
        viewBox="0 0 132 60"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="45%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="tail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <g transform="translate(6 4)">
          <polygon points="0,10 42,6 32,32" fill="url(#wing)" />
          <polygon points="42,6 72,0 46,30" fill="#fde047" />
          <polygon points="32,32 70,52 46,30" fill="url(#body)" />
          <polygon points="46,30 80,20 70,52" fill="#8b5cf6" />
          <polygon points="70,52 96,40 80,20" fill="url(#tail)" />
          <circle cx="86" cy="18" r="2" fill="#0f172a" />
        </g>
        <text
          x="50%"
          y="55"
          textAnchor="middle"
          fontFamily="'Poppins', 'Inter', 'Segoe UI', sans-serif"
          fontSize="16"
          letterSpacing="4"
          fontWeight="600"
          fill="#1e293b"
        >
          OREEGAM&apos;IA
        </text>
      </svg>
    </div>
  );
};

export default OreegamiaLogo;
