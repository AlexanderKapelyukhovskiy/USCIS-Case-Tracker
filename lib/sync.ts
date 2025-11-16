import crypto from 'crypto';
import prisma from './prisma';

const ENDPOINTS = [
  { key: 'api-cases', build: (r: string) => `https://my.uscis.gov/account/case-service/api/cases/${r}` },
  { key: 'receipt_info', build: (r: string) => `https://my.uscis.gov/secure-messaging/api/case-service/receipt_info/${r}` },
  { key: 'case_status', build: (r: string) => `https://my.uscis.gov/account/case-service/api/case_status/${r}` },
];

export async function syncMemberCases(memberId: number, cookieHeader?: string) {
  const cases = await prisma.case.findMany({ where: { memberId } });
  const results: any[] = [];
  for (const c of cases) {
    const caseResult: any = { receipt: c.receipt, type: c.type, endpoints: [] };
    for (const ep of ENDPOINTS) {
      const url = ep.build(c.receipt);
      try {
        const res = await fetch(url, {
          headers: {
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });
        if (!res.ok) {
          caseResult.endpoints.push({ endpoint: ep.key, status: res.status, saved: false });
          continue;
        }
        const json = await res.json();
        const content = JSON.stringify(json);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        const last = await prisma.caseResponse.findFirst({
          where: { caseId: c.id, endpoint: ep.key },
          orderBy: { fetchedAt: 'desc' },
        });
        const changed = !last || last.hash !== hash;
        if (changed) {
          await prisma.caseResponse.create({
            data: {
              caseId: c.id,
              endpoint: ep.key,
              hash,
              json,
            },
          });
        }
        caseResult.endpoints.push({ endpoint: ep.key, status: res.status, saved: true, changed });
      } catch (e: any) {
        caseResult.endpoints.push({ endpoint: ep.key, status: 0, saved: false, error: e.message });
      }
    }
    results.push(caseResult);
  }
  return { memberId, results };
}
