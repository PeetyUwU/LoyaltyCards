import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

const PUBLIC_PATHS = ['/login', '/register'];
const ADMIN_PATHS = ['/admin'];
const PUBLIC_ASSET_PATTERNS = [
	/^\/uploads\//,
	/\.webmanifest$/,
	/\.png$/,
	/\.ico$/,
	/\.svg$/,
	/\.jpg$/,
	/\.jpeg$/,
];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (PUBLIC_ASSET_PATTERNS.some((pattern) => pattern.test(pathname))) {
		return NextResponse.next();
	}

	const token = request.cookies.get('access_token')?.value;

	const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
	const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));

	if (!token && !isPublicPath) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	if (token && isPublicPath) {
		return NextResponse.redirect(new URL('/cards', request.url));
	}

	if (token && isAdminPath) {
		try {
			const payload = decodeJwt(token);
			const role = payload.role as string | undefined;
			if (role !== 'owner' && role !== 'admin') {
				return NextResponse.redirect(new URL('/cards', request.url));
			}
		} catch {
			return NextResponse.redirect(new URL('/login', request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
