'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';

interface ConfirmModalProps {
	isOpen: boolean;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
	isLoading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmModal({
	isOpen,
	title,
	message,
	confirmText,
	cancelText,
	isDestructive = false,
	isLoading = false,
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	const { t } = useTranslation();

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && !isLoading) {
				onCancel();
			}
		}
		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, isLoading, onCancel]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in'>
			<div className='w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-scale-in'>
				{title && (
					<h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
						{title}
					</h3>
				)}
				<p className='text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed'>
					{message}
				</p>

				<div className='mt-6 flex justify-end gap-2'>
					<button
						type='button'
						disabled={isLoading}
						onClick={onCancel}
						className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-50 transition-all duration-150'
					>
						{cancelText || t('common.cancel')}
					</button>
					<button
						type='button'
						disabled={isLoading}
						onClick={onConfirm}
						className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm active:scale-95 disabled:opacity-50 transition-all duration-150 ${
							isDestructive
								? 'bg-red-600 hover:bg-red-500'
								: 'bg-blue-600 hover:bg-blue-500'
						}`}
					>
						{isLoading
							? t('common.loading')
							: confirmText ||
								(isDestructive
									? t('common.delete')
									: t('common.save'))}
					</button>
				</div>
			</div>
		</div>
	);
}
