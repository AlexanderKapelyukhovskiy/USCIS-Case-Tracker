import React, { Suspense } from 'react';
import CaseDetails from './view';

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
  return (
    <main className="page stack" style={{ maxWidth: 950 }}>
      <Suspense fallback={<p>Loading...</p>}>
        <CaseDetails id={params.id} />
      </Suspense>
    </main>
  );
}
