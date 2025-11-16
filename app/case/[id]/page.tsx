import React, { Suspense } from 'react';
import CaseDetails from './view';

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <Suspense fallback={<p>Loading...</p>}>
        <CaseDetails id={params.id} />
      </Suspense>
    </main>
  );
}
