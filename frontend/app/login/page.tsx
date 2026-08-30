'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Login failed');
				setLoading(false);
				return;
			}

			router.push('/cards');
			router.refresh();
		} catch {
			setError('Something went wrong. Try again.');
			setLoading(false);
		}
	}

	return (
		<div className='flex min-h-screen items-center justify-center'>
			<form onSubmit={handleSubmit} className='w-full max-w-sm space-y-4'>
				<h1 className='text-2xl font-semibold'>Log in</h1>

				{error && <p className='text-sm text-red-600'>{error}</p>}

				<div>
					<label
						htmlFor='username'
						className='block text-sm font-medium'
					>
						Username
					</label>
					<input
						id='username'
						type='text'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<div>
					<label
						htmlFor='password'
						className='block text-sm font-medium'
					>
						Password
					</label>
					<input
						id='password'
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<button
					type='submit'
					disabled={loading}
					className='w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
				>
					{loading ? 'Logging in...' : 'Log in'}
				</button>
			</form>
		</div>
	);
}
