import { NextRequest } from 'next/server';
import { authOptions } from '../../../lib/auth';
import { getServerSession } from 'next-auth';
import { syncMemberCases } from '../../../lib/sync';
import prisma from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const body = await req.json().catch(() => ({}));
  const memberId = body.memberId as number;
  const email = session.user?.email || '';
  const member = await prisma.member.findFirst({ where: { id: memberId, userId: email } });
  if (!member) return new Response('Forbidden', { status: 403 });
  const cookie = body.cookie as string | undefined;
  if (!memberId) return new Response('memberId required', { status: 400 });
  const result = await syncMemberCases(memberId, cookie);
  return Response.json(result);
}
