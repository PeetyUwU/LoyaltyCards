import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;

	const backendRes = await fetch(`${BACKEND_URL}/cards/${id}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!backendRes.ok) {
		const error = await backendRes.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to delete card' },
			{ status: backendRes.status },
		);
	}

	return NextResponse.json({ success: true });
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;
	const body = await request.json();

	const backendRes = await fetch(`${BACKEND_URL}/cards/${id}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!backendRes.ok) {
		const error = await backendRes.json().catch(() => ({}));
		return NextResponse.json(
			{ detail: error.detail || 'Failed to update card' },
			{ status: backendRes.status },
		);
	}

	return NextResponse.json(await backendRes.json());
}
