'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation, Locale } from '@/context/LanguageContext';

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
	{ code: 'cs', label: 'Čeština', flag: '🇨🇿' },
	{ code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
	const { locale, setLocale } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const activeLanguage =
		LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div className='relative inline-block text-left' ref={containerRef}>
			{/* Trigger Button */}
			<button
				type='button'
				onClick={() => setIsOpen((prev) => !prev)}
				className='flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition'
				aria-expanded={isOpen}
				aria-haspopup='true'
			>
				<span>{activeLanguage.flag}</span>
				<span className='uppercase'>{activeLanguage.code}</span>
				<svg
					className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
					strokeWidth={2.5}
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						d='M19 9l-7 7-7-7'
					/>
				</svg>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className='absolute right-0 mt-1.5 w-36 origin-top-right rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100'>
					{LANGUAGES.map((lang) => {
						const isSelected = lang.code === locale;
						return (
							<button
								key={lang.code}
								type='button'
								onClick={() => {
									setLocale(lang.code);
									setIsOpen(false);
								}}
								className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
									isSelected
										? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
										: 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
								}`}
							>
								<div className='flex items-center gap-2'>
									<span>{lang.flag}</span>
									<span>{lang.label}</span>
								</div>
								{isSelected && (
									<svg
										className='h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
										strokeWidth={2.5}
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											d='M5 13l4 4L19 7'
										/>
									</svg>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
