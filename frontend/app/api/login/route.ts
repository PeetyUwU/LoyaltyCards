import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
	const body = await request.json();

	const formData = new URLSearchParams();
	formData.append('username', body.username);
	formData.append('password', body.password);

	const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: formData.toString(),
	});

	if (!backendRes.ok) {
		const error = await backendRes.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Login failed' },
			{ status: backendRes.status },
		);
	}

	const data = await backendRes.json();

	const response = NextResponse.json({ success: true });
	response.cookies.set('access_token', data.access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});

	return response;
}
