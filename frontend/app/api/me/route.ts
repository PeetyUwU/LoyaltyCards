import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

export async function GET() {
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;

	if (!token) {
		return NextResponse.json({ authenticated: false, role: null });
	}

	try {
		const payload = decodeJwt(token);
		return NextResponse.json({
			authenticated: true,
			role: (payload.role as string) || null,
		});
	} catch {
		return NextResponse.json({ authenticated: false, role: null });
	}
}
