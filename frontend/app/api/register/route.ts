import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
	const body = await request.json();

	const res = await fetch(`${BACKEND_URL}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Registration failed' },
			{ status: res.status },
		);
	}

	return NextResponse.json(await res.json());
}
