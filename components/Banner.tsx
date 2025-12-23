// components/Banner.tsx
'use client';

import Image from 'next/image';

interface BannerProps {
  imageUrl?: string;
  altText?: string;
  height?: string;
}

export default function Banner({ 
  imageUrl = "https://louveira.com.br/wp-content/uploads/sites/14/2025/12/mega-da-virada-2025-r-1-bilhao-em-jogo-como-apostar-no-maior-premio-da-historia-v6947e6386b4b2.jpg", 
  altText = "Banner do bolão",
  height = "h-48 md:h-56"
}: BannerProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden"> {/* Sem margin-bottom */}
        <div className={`relative w-full ${height}`}>
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>
      </div>
    </div>
  );
}