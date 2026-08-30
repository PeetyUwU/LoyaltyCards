'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
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
		<header className='sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md px-4 sm:px-6 py-3'>
			<Link
				href='/cards'
				className='flex items-center gap-2 text-lg font-bold tracking-tight hover:opacity-80 transition active:scale-95'
			>
				<span>Loyalty Cards</span>
			</Link>

			<div className='flex items-center gap-2 sm:gap-3'>
				{isAdminOrOwner && (
					<Link
						href='/admin'
						className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
							pathname.startsWith('/admin')
								? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-sm'
								: 'border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
						}`}
					>
						Admin
					</Link>
				)}

				<button
					type='button'
					onClick={handleLogout}
					className='rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-95 transition'
				>
					Logout
				</button>
			</div>
		</header>
	);
}
