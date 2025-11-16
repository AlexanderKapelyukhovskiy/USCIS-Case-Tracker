"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import Header from './components/Header';

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
      <main className="page stack" style={{ maxWidth: 780 }}>
        <h1>USCIS Case Tracking Helper</h1>
        <p>
          If you regularly check your immigration case status on the USCIS website, this tool makes that process easier.
          USCIS provides more detailed information behind the scenes via its JSON data. We surface and preserve those
          details for you automatically so you can see what changed—not just the latest status line.
        </p>
        <p>
          Sign in to:
        </p>
        <ul className="stack" style={{ paddingLeft: '1.1rem' }}>
          <li><strong>Organize cases</strong> for yourself or family members in one place.</li>
          <li><strong>Save history</strong> of detailed case responses so you can compare versions.</li>
          <li><strong>Spot changes fast</strong> with clear indicators showing what updated between syncs.</li>
          <li><strong>Drill into details</strong> beyond the basic status, including structured fields from the USCIS data.</li>
          <li><strong>Keep control</strong> – your data is scoped to your Google sign‑in, and session cookies you paste are only stored in your browser memory.</li>
        </ul>
        <p>
          This site doesn’t replace the official USCIS portal; it simply helps you monitor and understand the
          information the portal already exposes. Source code is open and available at{' '}
          <a href="https://github.com/AlexanderKapelyukhovskiy/USCIS-Case-Tracker" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
        <p className="muted">Nothing is fetched until you sign in.</p>
        <button className="primary" onClick={() => signIn('google')}>Sign in with Google</button>
      </main>
    );
  }

  const shownSyncResult = selected ? syncResultsByMember[selected] : null;
  const selectedMember = selected ? members.find(m => m.id === selected) : null;

  return (
    <main className="page stack">
      <Header title="USCIS Tracking" />
      <section className="stack">
        <h2>Members</h2>
        <div className="members">
          {members.map(m => (
            <button
              key={m.id}
              className={"" + (selected===m.id? 'active':'')}
              onClick={() => setSelected(m.id)}
            >{m.name}</button>
          ))}
        </div>
        <div className="row wrap" style={{ marginTop: '0.25rem' }}>
          <div style={{ flex: 1 }}>
            <input value={newMember} onChange={e=>setNewMember(e.target.value)} placeholder="New member name" />
          </div>
          <div style={{ flexBasis: '110px' }}>
            <button className="primary" onClick={addMember}>Add Member</button>
          </div>
        </div>
      </section>
      {selected && (
        <section className="stack">
          <h2>Cases for {selectedMember ? selectedMember.name : `member #${selected}`}</h2>
          <ul className="case-list">
            {cases.map(c => (
              <li key={c.id}>
                <Link href={`/case/${c.id}`} target="_blank">{c.type} / {c.receipt}</Link>
              </li>
            ))}
          </ul>
          <div className="row wrap">
            <input style={{ flex: 2 }} value={receipt} onChange={e=>setReceipt(e.target.value)} placeholder="Receipt (IOE...)" />
            <select style={{ flex: 1 }} value={type} onChange={e=>setType(e.target.value as CaseType)}>
              <option value="AP">AP</option>
              <option value="EAD">EAD</option>
              <option value="I485">I485</option>
              <option value="I485J">I485J</option>
            </select>
            <button style={{ flexBasis: '120px' }} className="primary" onClick={addCase}>Add Case</button>
          </div>
          <div className="stack">
            <label className="muted">Cookie header</label>
            <textarea style={{ minHeight: 130 }} value={currentCookie()} onChange={e=>updateCookie(e.target.value)} />
            <button className="primary" disabled={loading} onClick={sync}>{loading? 'Syncing...':'Sync Cases'}</button>
          </div>
        </section>
      )}
      {shownSyncResult && (
        <section className="stack">
          <h2>Last Sync Result</h2>
          {shownSyncResult.results.map((r:any)=> (
            <div key={r.receipt} className="sync-item">
              <strong>{r.type} / {r.receipt}</strong>
              <ul>
                {r.endpoints.map((e:any)=> {
                  const cls = e.saved ? (e.changed ? 'status-green' : 'status-gray') : 'status-orange';
                  return (
                    <li key={e.endpoint} className={cls}>
                      {e.endpoint} {e.saved ? (e.changed ? '✓ changed' : '✓ no changes') : `✗ (${e.status})`} {e.error && <em>({e.error})</em>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
