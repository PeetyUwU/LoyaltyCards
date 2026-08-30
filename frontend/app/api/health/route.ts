import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

export async function GET() {
	const checks: Record<string, string> = {
		frontend_process: 'ok',
		backend_connectivity: 'unknown',
	};
	let isHealthy = true;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);

		const res = await fetch(`${BACKEND_URL}/health`, {
			signal: controller.signal,
			cache: 'no-store',
		});
		clearTimeout(timeout);

		if (res.ok) {
			checks.backend_connectivity = 'connected';
		} else {
			checks.backend_connectivity = `upstream error (${res.status})`;
			isHealthy = false;
		}
	} catch (err) {
		checks.backend_connectivity = `unreachable: ${(err as Error).message}`;
		isHealthy = false;
	}

	const memUsage = process.memoryUsage();
	const heapUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
	checks.memory = `${heapUsedMb}MB heap used`;

	if (!isHealthy) {
		return NextResponse.json(
			{ status: 'degraded', checks },
			{ status: 503 },
		);
	}

	return NextResponse.json({ status: 'healthy', checks }, { status: 200 });
}
