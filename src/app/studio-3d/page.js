import Studio3DClient from '@/components/studio3d/Studio3DClient';

export const metadata = {
  title: 'Studio 3D · Projet de Sidi Ouaziz | Association Palmeraies Tighremt',
  description:
    "Maquette 3D interactive du projet d'aménagement de Sidi Ouaziz : terrain de football, bassin de rétention et jardins collaboratifs, d'après le plan au 1:500.",
  alternates: { canonical: 'https://association-palmeraies-tighremt.com/studio-3d' },
};

export default function Studio3DPage() {
  return <Studio3DClient />;
}
