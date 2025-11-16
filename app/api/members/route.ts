import { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authOptions } from '../../../lib/auth';
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const email = session.user?.email || '';
  const members = await prisma.member.findMany({ where: { userId: email }, orderBy: { id: 'asc' } });
  return Response.json(members);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const body = await req.json();
  const name = (body.name || '').trim();
  if (!name) return new Response('Name required', { status: 400 });
  const email = session.user?.email || '';
  const member = await prisma.member.create({ data: { name, userId: email } });
  return Response.json(member);
}
