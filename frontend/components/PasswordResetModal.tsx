'use client';

import { useState } from 'react';
import { AdminUser } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface PasswordResetModalProps {
	user: AdminUser | null;
	isLoading: boolean;
	onClose: () => void;
	onSubmit: (password: string) => Promise<void>;
}

export default function PasswordResetModal({
	user,
	isLoading,
	onClose,
	onSubmit,
}: PasswordResetModalProps) {
	const { t } = useTranslation();
	const [password, setPassword] = useState('');

	if (!user) return null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!password) return;
		await onSubmit(password);
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
			<div className='w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
				<h3 className='text-lg font-bold'>
					{t('admin.reset_modal.title')}
				</h3>
				<p className='text-xs text-zinc-500 mt-1'>
					{t('admin.reset_modal.desc', {
						name: user.username,
					})}
				</p>

				<form onSubmit={handleSubmit} className='mt-4 space-y-4'>
					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
							{t('admin.reset_modal.password_label')}
						</label>
						<input
							type='password'
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={t(
								'admin.reset_modal.password_placeholder',
							)}
							className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div className='flex gap-2 justify-end pt-2'>
						<button
							type='button'
							disabled={isLoading}
							onClick={onClose}
							className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition'
						>
							{t('common.cancel')}
						</button>
						<button
							type='submit'
							disabled={isLoading}
							className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
						>
							{isLoading
								? t('admin.reset_modal.submitting_btn')
								: t('admin.reset_modal.submit_btn')}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
