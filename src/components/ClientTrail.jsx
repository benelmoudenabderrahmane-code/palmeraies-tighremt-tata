'use client';
import dynamic from 'next/dynamic';

const PixelatedImageTrail = dynamic(
  () => import('./ui/pixelated-image-trail').then(m => m.PixelatedImageTrail),
  { ssr: false }
);

const TRAIL_IMAGES = [
  'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=300&q=70',
  'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=300&q=70',
  'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=300&q=70',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&q=70',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=70',
];

export default function ClientTrail() {
  return (
    <PixelatedImageTrail
      images={TRAIL_IMAGES}
      slices={4}
      spawnThreshold={80}
      smoothing={0.12}
    />
  );
}
