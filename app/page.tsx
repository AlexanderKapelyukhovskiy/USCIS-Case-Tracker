"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';

type CaseType = 'AP' | 'EAD' | 'I485' | 'I485J';

export default function RootV2() {
  const { status } = useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [newMember, setNewMember] = useState('');
  const [receipt, setReceipt] = useState('');
  const [type, setType] = useState<CaseType>('EAD');
  const [cookiesByMember, setCookiesByMember] = useState<Record<number, string>>({});
  const [syncResultsByMember, setSyncResultsByMember] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
  const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data);
  }
  async function loadCases(memberId: number) {
  const res = await fetch(`/api/cases?memberId=${memberId}`);
    const data = await res.json();
    setCases(data);
  }
  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { if (selected) loadCases(selected); }, [selected]);

  function currentCookie(): string {
    if (!selected) return '';
    return cookiesByMember[selected] ?? '_myuscis_session_rx=';
  }
  function updateCookie(val: string) {
    if (!selected) return;
    setCookiesByMember(prev => ({ ...prev, [selected]: val }));
  }

  async function addMember() {
    if (!newMember.trim()) return;
  await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMember }) });
    setNewMember('');
    loadMembers();
  }
  async function addCase() {
    if (!selected || !receipt.trim()) return;
  await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: selected, receipt, type }) });
    setReceipt('');
    loadCases(selected);
  }
  async function sync() {
    if (!selected) return;
    setLoading(true);
    const cookieHeader = currentCookie();
  const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: selected, cookie: cookieHeader }) });
    const data = await res.json();
    setSyncResultsByMember(prev => ({ ...prev, [selected]: data }));
    setLoading(false);
  }

  if (status !== 'authenticated') {
    return (
      <div style={{ padding: 40, maxWidth: 780, fontFamily: 'system-ui', lineHeight: 1.4 }}>
        <h1 style={{ marginTop: 0 }}>USCIS Case Change Tracker</h1>
        <p>
          This private tool lets you monitor USCIS case JSON responses (case summary, receipt info, status) over time
          for multiple family members or applicants. Each sync fetches live data from <code>my.uscis.gov</code>, stores only
          changed responses (via SHA-256 hash), and shows per-endpoint change indicators. You can drill into any case to see
          a structured diff versus its previous version.
        </p>
        <ul style={{ paddingLeft: '1.2rem' }}>
          <li><strong>Members:</strong> Create logical people (names) scoped to your login.</li>
          <li><strong>Cases:</strong> Add receipt + type (AP, EAD, I485, I485J). Same receipts allowed for different members/users.</li>
          <li><strong>Sync:</strong> Paste your authenticated USCIS <code>Cookie</code> header per member; only changed JSON is saved.</li>
          <li><strong>History & Diff:</strong> Case detail page lists all stored versions with field‑level differences.</li>
          <li><strong>Privacy:</strong> Data is isolated to your Google account (email used as userId).</li>
        </ul>
        <p style={{ fontSize: 13, color: '#555' }}>No data is fetched until you sign in. Cookies you paste are kept only in your browser state.</p>
        <button onClick={() => signIn('google')} style={{ marginTop: 12, padding: '0.75rem 1.25rem', fontSize: 16 }}>Sign in with Google</button>
      </div>
    );
  }

  const shownSyncResult = selected ? syncResultsByMember[selected] : null;
  const selectedMember = selected ? members.find(m => m.id === selected) : null;

  return (
    <main style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>USCIS Tracking (DB)</h1>
      <section style={{ marginBottom: '1rem' }}>
        <h2>Members</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {members.map(m => (
            <button key={m.id} onClick={() => setSelected(m.id)} style={{ padding: '0.5rem', background: selected===m.id? '#333': '#eee', color: selected===m.id? '#fff':'#000' }}>{m.name}</button>
          ))}
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <input value={newMember} onChange={e=>setNewMember(e.target.value)} placeholder="New member name" />
          <button onClick={addMember} style={{ marginLeft: '0.5rem' }}>Add Member</button>
        </div>
      </section>
      {selected && (
        <section style={{ marginBottom: '1rem' }}>
          <h2>Cases for {selectedMember ? selectedMember.name : `member #${selected}`}</h2>
          <ul>
            {cases.map(c => (
              <li key={c.id}>
                <Link href={`/case/${c.id}`} target="_blank" style={{ textDecoration: 'none' }}>
                  {c.type} / {c.receipt}
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '0.5rem' }}>
            <input value={receipt} onChange={e=>setReceipt(e.target.value)} placeholder="Receipt (IOE...)" />
            <select value={type} onChange={e=>setType(e.target.value as CaseType)}>
              <option value="AP">AP</option>
              <option value="EAD">EAD</option>
              <option value="I485">I485</option>
              <option value="I485J">I485J</option>
            </select>
            <button onClick={addCase} style={{ marginLeft: '0.5rem' }}>Add Case</button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label>Cookie header (stored per member)</label>
            <textarea value={currentCookie()} onChange={e=>updateCookie(e.target.value)} style={{ width: '100%', height: 120 }} />
            <button disabled={loading} onClick={sync} style={{ marginTop: '0.5rem' }}>{loading? 'Syncing...':'Sync Cases'}</button>
          </div>
        </section>
      )}
      {shownSyncResult && (
        <section>
          <h2>Last Sync Result (member #{selected})</h2>
          {shownSyncResult.results.map((r:any)=> (
            <div key={r.receipt} style={{ border: '1px solid #ddd', padding: '0.5rem', marginBottom: '0.5rem' }}>
              <strong>{r.type} / {r.receipt}</strong>
              <ul>
                {r.endpoints.map((e:any)=> (
                  <li key={e.endpoint} style={{ color: e.saved ? (e.changed ? 'green' : 'gray') : 'orange' }}>
                    {e.endpoint} {e.saved ? (e.changed ? '✓ changed' : '✓ no changes') : `✗ (${e.status})`} {e.error && <em>({e.error})</em>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
