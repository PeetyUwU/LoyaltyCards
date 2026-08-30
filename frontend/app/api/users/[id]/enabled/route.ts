import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const { is_active } = await request.json();

	const res = await fetch(
		`${BACKEND_URL}/users/${id}/enabled?is_active=${is_active}`,
		{
			method: 'PATCH',
			headers: { Authorization: `Bearer ${token}` },
		},
	);

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to update user' },
			{ status: res.status },
		);
	}
	return NextResponse.json(await res.json());
}
