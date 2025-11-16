import { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authOptions } from '../../../lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const email = session.user?.email || '';
  const memberId = parseInt(req.nextUrl.searchParams.get('memberId') || '0', 10);
  if (!memberId) return Response.json([]);
  const member = await prisma.member.findFirst({ where: { id: memberId, userId: email } });
  if (!member) return new Response('Forbidden', { status: 403 });
  const cases = await prisma.case.findMany({ where: { memberId }, orderBy: { id: 'asc' } });
  return Response.json(cases);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const email = session.user?.email || '';
  const body = await req.json();
  const memberId = body.memberId;
  const receipt = (body.receipt || '').trim();
  const type = body.type as 'AP' | 'EAD' | 'I485' | 'I485J';
  if (!memberId || !receipt || !type) return new Response('memberId, receipt, type required', { status: 400 });
  const member = await prisma.member.findFirst({ where: { id: memberId, userId: email } });
  if (!member) return new Response('Forbidden', { status: 403 });
  try {
    const c = await prisma.case.create({ data: { memberId, receipt, type } });
    return Response.json(c);
  } catch (e: any) {
    return new Response(e.message, { status: 400 });
  }
}
