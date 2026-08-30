import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id } = await context.params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;

	let isActive = request.nextUrl.searchParams.get('is_active');

	if (isActive === null) {
		try {
			const body = await request.json();
			if (typeof body?.is_active === 'boolean') {
				isActive = String(body.is_active);
			}
		} catch {}
	}

	if (isActive === null) {
		return NextResponse.json(
			{ detail: 'Missing is_active query parameter or body field' },
			{ status: 400 },
		);
	}

	const res = await fetch(
		`${BACKEND_URL}/users/${id}/enabled?is_active=${isActive}`,
		{
			method: 'PATCH',
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		},
	);

	const data = await res.json().catch(() => ({}));

	return NextResponse.json(data, { status: res.status });
}
