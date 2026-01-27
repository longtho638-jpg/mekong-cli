'use client';

import dynamic from 'next/dynamic';

const DnDEditor = dynamic(() => import('../../components/builder/DnDEditor'), {
  ssr: false,
});

export default function BuilderPage() {
  return <DnDEditor />;
}
