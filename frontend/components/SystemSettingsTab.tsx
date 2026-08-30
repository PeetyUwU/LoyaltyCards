'use client';

import { AppSettings } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface SystemSettingsTabProps {
	settings: AppSettings;
	isLoading: boolean;
	onToggleRegistration: () => void;
}

export default function SystemSettingsTab({
	settings,
	isLoading,
	onToggleRegistration,
}: SystemSettingsTabProps) {
	const { t } = useTranslation();

	return (
		<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-6 shadow-sm animate-fade-in'>
			<div>
				<h2 className='text-lg font-bold'>
					{t('admin.settings.title')}
				</h2>
				<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1'>
					{t('admin.settings.desc')}
				</p>
			</div>

			<div className='flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800'>
				<div>
					<p className='font-semibold text-sm'>
						{t('admin.settings.allow_label')}
					</p>
					<p className='text-xs text-zinc-500 mt-0.5'>
						{settings.registration_enabled
							? t('admin.settings.open_info')
							: t('admin.settings.closed_info')}
					</p>
				</div>
				<button
					type='button'
					disabled={isLoading}
					onClick={onToggleRegistration}
					className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
						settings.registration_enabled
							? 'bg-blue-600'
							: 'bg-zinc-300 dark:bg-zinc-700'
					}`}
				>
					<span
						className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
							settings.registration_enabled
								? 'translate-x-5'
								: 'translate-x-0'
						}`}
					/>
				</button>
			</div>
		</div>
	);
}
