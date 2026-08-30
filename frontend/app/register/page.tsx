'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Registration failed');
				setLoading(false);
				return;
			}

			const loginRes = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});

			if (!loginRes.ok) {
				router.push('/login');
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
				<h1 className='text-2xl font-semibold'>Create account</h1>

				{error && <p className='text-sm text-red-600'>{error}</p>}

				<div>
					<label className='block text-sm font-medium'>
						Username
					</label>
					<input
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium'>Email</label>
					<input
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium'>
						Password
					</label>
					<input
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
					{loading ? 'Creating account...' : 'Create account'}
				</button>

				<p className='text-center text-sm text-gray-400'>
					Already have an account?{' '}
					<Link href='/login' className='text-blue-500'>
						Log in
					</Link>
				</p>
			</form>
		</div>
	);
}
