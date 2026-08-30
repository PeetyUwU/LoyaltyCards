'use client';

export default function OfflinePage() {
	return (
		<div className='flex min-h-[100dvh] flex-col items-center justify-center p-4 text-center bg-white dark:bg-zinc-950'>
			<h1 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2'>
				You are offline
			</h1>
			<p className='text-sm text-zinc-500 dark:text-zinc-400 max-w-sm'>
				Please check your internet connection. Previously cached cards
				might still be available if you go back.
			</p>
			<button
				onClick={() => window.history.back()}
				className='mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition cursor-pointer'
			>
				Go Back
			</button>
		</div>
	);
}
