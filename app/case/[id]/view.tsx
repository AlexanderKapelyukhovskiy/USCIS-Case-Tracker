"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CaseResponseItem {
  id: number;
  endpoint: string;
  hash: string;
  fetchedAt: string;
  json: any;
}
interface CaseDetailsData {
  id: number;
  receipt: string;
  type: string;
  member: { id: number; name: string };
  responses: CaseResponseItem[];
  error?: string;
}

interface DiffEntry {
  path: string;
  before: any;
  after: any;
}

function computeDiff(prev: any, curr: any, basePath = ''): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  if (prev === curr) return diffs;
  if (typeof prev !== 'object' || prev === null || typeof curr !== 'object' || curr === null) {
    if (prev !== curr) diffs.push({ path: basePath || '(root)', before: prev, after: curr });
    return diffs;
  }
  const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
  for (const k of keys) {
    const pVal = prev[k];
    const cVal = curr[k];
    const path = basePath ? basePath + '.' + k : k;
    if (typeof pVal === 'object' && pVal !== null && typeof cVal === 'object' && cVal !== null) {
      diffs.push(...computeDiff(pVal, cVal, path));
    } else if (pVal !== cVal) {
      diffs.push({ path, before: pVal, after: cVal });
    }
  }
  return diffs;
}

function PrettyJson({ value }: { value: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
      <button onClick={() => setExpanded(e => !e)} style={{ marginBottom: 4 }}>
        {expanded ? 'Collapse' : 'Expand'}
      </button>
      {expanded && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 8, borderRadius: 4, maxHeight: 400, overflow: 'auto' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function CaseDetails({ id }: { id: string }) {
  const [data, setData] = useState<CaseDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
  const res = await fetch(`/api/case/${id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <p>Loading details...</p>;
  if (!data || (data as any).error) return <p>Error: {(data as any).error || 'Unknown'}</p>;

  return (
    <div className="stack">
      <h1>Case {data.type} / {data.receipt}</h1>
      <p className="muted">Member: {data.member.name} (ID {data.member.id})</p>
      <p><Link href="/" target="_self">Back to list</Link></p>
      <h2>Responses</h2>
      {data.responses.length === 0 && <p>No stored responses yet.</p>}
      <div className="responses">
        {data.responses.map((r, idx) => {
          const prevSameEndpoint = data.responses.slice(idx + 1).find(pr => pr.endpoint === r.endpoint);
          const diffs = prevSameEndpoint ? computeDiff(prevSameEndpoint.json, r.json) : [];
          return (
            <div key={r.id} className="response-card">
              <strong>{r.endpoint}</strong>{' '}
              <small>{new Date(r.fetchedAt).toLocaleString()}</small>
              {prevSameEndpoint && (
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  {diffs.length === 0 ? (
                    <span className="status-gray">No changes vs previous version.</span>
                  ) : (
                    <details>
                      <summary style={{ cursor: 'pointer' }}>{diffs.length} change{diffs.length>1?'s':''} vs previous.</summary>
                      <ul className="diff-list">
                        {diffs.map(d => (
                          <li key={d.path}>
                            <code>{d.path}</code>: <span style={{ color: '#b00' }}>{JSON.stringify(d.before)}</span> → <span style={{ color: '#080' }}>{JSON.stringify(d.after)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              <details style={{ marginTop: 6 }}>
                <summary>JSON ({r.hash.slice(0,8)}...)</summary>
                <PrettyJson value={r.json} />
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
