"use client";
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header({ title }: { title: string }) {
  const { status } = useSession();
  return (
    <header className="row wrap" style={{ alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}><h1 style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h1></Link>
      {status === 'authenticated' ? (
        <div className="row" style={{ gap: '0.5rem' }}>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      ) : (
        <button className="primary" onClick={() => signIn('google')}>Sign in</button>
      )}
    </header>
  );
}
