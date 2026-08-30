import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const body = await request.json();

	const res = await fetch(`${BACKEND_URL}/cards/${id}/share`, {
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
			{ detail: error.detail || 'Failed to share card' },
			{ status: res.status },
		);
	}
	return NextResponse.json({ success: true });
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const body = await request.json();

	const res = await fetch(
		`${BACKEND_URL}/cards/${id}/share/${body.user_id}`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ access_level: body.access_level }),
		},
	);

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to update access level' },
			{ status: res.status },
		);
	}
	return NextResponse.json({ success: true });
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const userId = request.nextUrl.searchParams.get('user_id');

	const res = await fetch(`${BACKEND_URL}/cards/${id}/share/${userId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to remove access' },
			{ status: res.status },
		);
	}
	return NextResponse.json({ success: true });
}
