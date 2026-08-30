import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function apiFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const cookieStore = await cookies();
	const token = cookieStore.get('access_token')?.value;

	const res = await fetch(`${BACKEND_URL}${path}`, {
		...options,
		headers: {
			...options.headers,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			'Content-Type': 'application/json',
		},
		cache: 'no-store',
	});

	if (!res.ok) {
		const errorBody = await res.json().catch(() => ({}));
		throw new Error(errorBody.detail || `Request failed: ${res.status}`);
	}

	return res.json();
}
