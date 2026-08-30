import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const body = await request.json();

	const url = new URL(`${BACKEND_URL}/users/`);
	if (body.role_name) url.searchParams.set('role_name', body.role_name);

	const res = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username: body.username,
			email: body.email,
			password: body.password,
		}),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to create user' },
			{ status: res.status },
		);
	}
	return NextResponse.json(await res.json());
}
