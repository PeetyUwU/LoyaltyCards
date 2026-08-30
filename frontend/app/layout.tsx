import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import './globals.css';
import Navbar from '../components/Navbar';
import { LanguageProvider, Locale } from '@/context/LanguageContext';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ffffff' },
		{ media: '(prefers-color-scheme: dark)', color: '#09090b' },
	],
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: 'cover',
};

export const metadata: Metadata = {
	title: 'Loyalty Cards',
	description: 'Manage and display your loyalty cards quickly',
	manifest: '/site.webmanifest',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'Cards',
	},
};

async function getInitialServerLocale(): Promise<Locale> {
	const cookieStore = await cookies();
	const cookieLocale = cookieStore.get('app_locale')?.value;
	if (cookieLocale === 'en' || cookieLocale === 'cs') {
		return cookieLocale;
	}

	const headerList = await headers();
	const acceptLanguage = headerList.get('accept-language') || '';
	if (acceptLanguage.toLowerCase().includes('cs')) {
		return 'cs';
	}

	return 'en';
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const initialLocale = await getInitialServerLocale();

	return (
		<html
			lang={initialLocale}
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className='min-h-full flex flex-col'>
				<LanguageProvider initialLocale={initialLocale}>
					<Navbar />
					<main className='flex-1'>{children}</main>
				</LanguageProvider>
			</body>
		</html>
	);
}
