import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const caseId = Number(params.id);
  if (Number.isNaN(caseId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { member: true, responses: { orderBy: { fetchedAt: 'desc' } } } });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (c.member.userId !== session.user.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({
    id: c.id,
    receipt: c.receipt,
    type: c.type,
    member: { id: c.member.id, name: c.member.name },
    responses: c.responses.map((r: any) => ({ id: r.id, endpoint: r.endpoint, hash: r.hash, fetchedAt: r.fetchedAt, json: r.json }))
  });
}