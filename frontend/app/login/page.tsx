'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { t } = useTranslation();

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
				setError(data.detail || t('auth.login_failed'));
				setLoading(false);
				return;
			}

			router.push('/cards');
			router.refresh();
		} catch {
			setError(t('common.generic_error'));
			setLoading(false);
		}
	}

	return (
		<div className='relative flex min-h-[100dvh] flex-col justify-between px-4 py-6 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]'>
			{/* Top Toolbar */}
			<div className='flex items-center justify-between mx-auto w-full max-w-sm'>
				<div className='flex items-center gap-2'>
					<div className='flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs'>
						<svg
							className='h-4 w-4'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2.2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<rect x='2' y='5' width='20' height='14' rx='2' />
							<line x1='2' y1='10' x2='22' y2='10' />
						</svg>
					</div>
					<span className='font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100'>
						{t('app.title', 'Loyalty Cards')}
					</span>
				</div>

				<LanguageSwitcher />
			</div>

			{/* Login Card Form */}
			<div className='mx-auto w-full max-w-sm my-auto'>
				<div className='rounded-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-md animate-slide-up'>
					<div className='mb-6 text-left'>
						<h1 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
							{t('auth.login_title')}
						</h1>
						<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1'>
							{t('auth.login_subtitle')}
						</p>
					</div>

					{error && (
						<div className='mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400 animate-shake'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label
								htmlFor='username'
								className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5'
							>
								{t('auth.username')}
							</label>
							<input
								id='username'
								type='text'
								autoComplete='username'
								placeholder={t('auth.username_placeholder')}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
							/>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5'
							>
								{t('auth.password')}
							</label>
							<input
								id='password'
								type='password'
								autoComplete='current-password'
								placeholder={t('auth.password_placeholder')}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
							/>
						</div>

						<button
							type='submit'
							disabled={loading}
							className='w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 transition-all duration-150 cursor-pointer mt-2'
						>
							{loading
								? t('auth.logging_in')
								: t('auth.login_btn')}
						</button>
					</form>

					<div className='mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-center'>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							{t('auth.no_account')}{' '}
							<Link
								href='/register'
								className='font-semibold text-blue-600 dark:text-blue-400 hover:underline'
							>
								{t('auth.register_link')}
							</Link>
						</p>
					</div>
				</div>
			</div>

			{/* Bottom empty spacing for balanced vertical centering on mobile */}
			<div className='h-4 shrink-0' />
		</div>
	);
}
