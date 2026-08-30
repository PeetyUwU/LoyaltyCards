import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;

	const res = await fetch(`${BACKEND_URL}/presets/`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: 'no-store',
	});

	if (!res.ok) {
		return NextResponse.json(
			{ detail: 'Failed to load presets' },
			{ status: res.status },
		);
	}
	return NextResponse.json(await res.json());
}
