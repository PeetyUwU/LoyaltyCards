import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const body = await request.json();

	const res = await fetch(`${BACKEND_URL}/cards/`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to create card' },
			{ status: res.status },
		);
	}
	return NextResponse.json(await res.json());
}
