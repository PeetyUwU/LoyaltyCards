import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const q = request.nextUrl.searchParams.get('q');

	const url = new URL(`${BACKEND_URL}/users/`);
	if (q) url.searchParams.set('q', q);

	const res = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${token}` },
		cache: 'no-store',
	});

	if (!res.ok) {
		return NextResponse.json(
			{ detail: 'Failed to load users' },
			{ status: res.status },
		);
	}
	return NextResponse.json(await res.json());
}
