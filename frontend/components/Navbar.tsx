'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { t } = useTranslation();
	const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);

	const hideNavbar = pathname === '/login' || pathname === '/register';

	useEffect(() => {
		if (hideNavbar) return;

		fetch('/api/me')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.role === 'admin' || data?.role === 'owner') {
					setIsAdminOrOwner(true);
				} else {
					setIsAdminOrOwner(false);
				}
			})
			.catch(() => {
				setIsAdminOrOwner(false);
			});
	}, [pathname, hideNavbar]);

	if (hideNavbar) {
		return null;
	}

	async function handleLogout() {
		await fetch('/api/logout', { method: 'POST' });
		setIsAdminOrOwner(false);
		router.push('/login');
		router.refresh();
	}

	return (
		<header className='sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-3 sm:px-6 py-2.5 gap-2'>
			<Link
				href='/cards'
				className='flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition active:scale-95 shrink-0 min-w-0'
			>
				<div className='flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0'>
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
				<span className='hidden min-[480px]:inline text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate'>
					{t('app.title', 'Loyalty Cards')}
				</span>
			</Link>

			<div className='flex items-center gap-1.5 sm:gap-2.5 shrink-0'>
				<LanguageSwitcher />

				{isAdminOrOwner && (
					<Link
						href='/admin'
						className={`rounded-xl border px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
							pathname.startsWith('/admin')
								? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs'
								: 'border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
						}`}
					>
						{t('nav.admin', 'Admin')}
					</Link>
				)}

				<button
					type='button'
					onClick={handleLogout}
					className='rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-95 transition'
				>
					{t('nav.logout', 'Logout')}
				</button>
			</div>
		</header>
	);
}
