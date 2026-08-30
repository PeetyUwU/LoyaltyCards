'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '@/locales/en.json';
import cs from '@/locales/cs.json';

export type Locale = 'en' | 'cs';

const translations: Record<Locale, typeof en> = {
	en,
	cs,
};

type TranslationParams = Record<string, string | number>;

interface LanguageContextType {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	isReady: boolean;
	t: {
		(path: string, fallback?: string): string;
		(path: string, params?: TranslationParams, fallback?: string): string;
	};
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

function getInitialLocale(): Locale {
	if (typeof window === 'undefined') return 'en';

	try {
		const match = document.cookie.match(/(?:^|;\s*)app_locale=([^;]+)/);
		if (match && (match[1] === 'en' || match[1] === 'cs')) {
			return match[1] as Locale;
		}

		const saved = localStorage.getItem('app_locale') as Locale | null;
		if (saved === 'en' || saved === 'cs') {
			return saved;
		}

		if (navigator.language.toLowerCase().startsWith('cs')) {
			return 'cs';
		}
	} catch {}

	return 'en';
}

export function LanguageProvider({
	children,
	initialLocale = 'en',
}: {
	children: React.ReactNode;
	initialLocale?: Locale;
}) {
	const [locale, setLocaleState] = useState<Locale>(initialLocale);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		try {
			const detected = getInitialLocale();
			if (detected !== locale) {
				setLocaleState(detected);
				document.documentElement.lang = detected;
			}
		} catch {
		} finally {
			setIsReady(true);
		}
	}, []);

	const setLocale = (newLocale: Locale) => {
		setLocaleState(newLocale);
		try {
			localStorage.setItem('app_locale', newLocale);
		} catch {}
		document.cookie = `app_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
		document.documentElement.lang = newLocale;
	};

	function t(
		path: string,
		paramsOrFallback?: TranslationParams | string,
		fallback?: string,
	): string {
		const params =
			typeof paramsOrFallback === 'object' ? paramsOrFallback : undefined;
		const defaultText =
			typeof paramsOrFallback === 'string'
				? paramsOrFallback
				: fallback || path;

		const keys = path.split('.');
		let current: any = translations[locale];

		for (const key of keys) {
			if (current && typeof current === 'object' && key in current) {
				current = current[key];
			} else {
				current = defaultText;
				break;
			}
		}

		let text = typeof current === 'string' ? current : defaultText;

		if (params) {
			Object.entries(params).forEach(([key, val]) => {
				text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
			});
		}

		return text;
	}

	return (
		<LanguageContext.Provider value={{ locale, setLocale, isReady, t }}>
			{!isReady ? (
				<div className='flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950'>
					<div className='h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-500' />
				</div>
			) : (
				children
			)}
		</LanguageContext.Provider>
	);
}

export function useTranslation() {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error(
			'useTranslation must be used within a LanguageProvider',
		);
	}
	return context;
}
