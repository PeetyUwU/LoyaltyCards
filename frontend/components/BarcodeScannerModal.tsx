'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useTranslation } from '@/context/LanguageContext';

interface BarcodeScannerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onScan: (scannedText: string) => void;
}

export default function BarcodeScannerModal({
	isOpen,
	onClose,
	onScan,
}: BarcodeScannerModalProps) {
	const { t } = useTranslation();
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [mode, setMode] = useState<'camera' | 'upload'>('camera');
	const [error, setError] = useState<string | null>(null);
	const [isDecodingFile, setIsDecodingFile] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Ensure we only render the portal on the client side
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen || mode !== 'camera') return;

		const codeReader = new BrowserMultiFormatReader();
		setError(null);

		codeReader
			.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
				if (result) {
					const text = result.getText();
					if (text) {
						onScan(text);
						onClose();
					}
				}
			})
			.catch((err: unknown) => {
				const msg =
					err instanceof DOMException &&
					err.name === 'NotAllowedError'
						? t('scanner.permission_denied')
						: t('scanner.no_camera');
				setError(msg);
			});

		return () => {
			if (videoRef.current && videoRef.current.srcObject) {
				const stream = videoRef.current.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
				videoRef.current.srcObject = null;
			}
		};
	}, [isOpen, mode, onClose, onScan, t]);

	async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		setError(null);
		setIsDecodingFile(true);

		const imgUrl = URL.createObjectURL(file);
		const img = new Image();

		img.onload = async () => {
			try {
				const codeReader = new BrowserMultiFormatReader();
				const result = await codeReader.decodeFromImageElement(img);
				const text = result.getText();
				if (text) {
					onScan(text);
					onClose();
				} else {
					setError(t('scanner.no_code_found'));
				}
			} catch {
				setError(t('scanner.no_code_found'));
			} finally {
				URL.revokeObjectURL(imgUrl);
				setIsDecodingFile(false);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(imgUrl);
			setIsDecodingFile(false);
			setError(t('scanner.file_read_error'));
		};

		img.src = imgUrl;
	}

	if (!isOpen || !mounted) return null;

	// We use createPortal to break out of any scrollable parent containers
	return createPortal(
		<div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in'>
			<div className='relative w-full max-w-sm max-h-[95dvh] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl animate-scale-in'>
				<div className='p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0'>
					<h3 className='font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100'>
						{t('scanner.scan_barcode')}
					</h3>
					<button
						type='button'
						onClick={onClose}
						className='rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer'
					>
						✕
					</button>
				</div>

				<div className='p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-2 shrink-0'>
					<button
						type='button'
						onClick={() => {
							setMode('camera');
							setError(null);
						}}
						className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
							mode === 'camera'
								? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-zinc-700'
								: 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
						}`}
					>
						{t('scanner.tab_camera')}
					</button>
					<button
						type='button'
						onClick={() => {
							setMode('upload');
							setError(null);
						}}
						className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
							mode === 'upload'
								? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-zinc-700'
								: 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
						}`}
					>
						{t('scanner.tab_upload')}
					</button>
				</div>

				<div className='relative bg-black flex-1 min-h-[250px] flex items-center justify-center overflow-hidden'>
					{mode === 'camera' ? (
						error ? (
							<div className='p-6 text-center text-xs font-medium text-red-400'>
								{error}
							</div>
						) : (
							<>
								<video
									ref={videoRef}
									className='h-full w-full object-cover'
									playsInline
									muted
								/>
								<div className='pointer-events-none absolute inset-8 border-2 border-dashed border-blue-500 rounded-2xl animate-pulse' />
							</>
						)
					) : (
						<div className='flex flex-col items-center justify-center p-6 text-center bg-zinc-100 dark:bg-zinc-950 w-full h-full'>
							<input
								ref={fileInputRef}
								type='file'
								accept='image/*'
								className='hidden'
								onChange={handleFileUpload}
							/>
							<button
								type='button'
								disabled={isDecodingFile}
								onClick={() => fileInputRef.current?.click()}
								className='flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 rounded-2xl cursor-pointer w-full max-w-[220px] transition'
							>
								<svg
									className='w-8 h-8 text-zinc-400'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={1.5}
										d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
									/>
								</svg>
								<span className='text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
									{isDecodingFile
										? t('scanner.decoding')
										: t('scanner.select_image')}
								</span>
							</button>

							{error && (
								<p className='mt-4 text-xs font-medium text-red-500'>
									{error}
								</p>
							)}
						</div>
					)}
				</div>

				<div className='p-4 text-center shrink-0'>
					<p className='text-xs text-zinc-500 dark:text-zinc-400'>
						{mode === 'camera'
							? t('scanner.point_camera')
							: t('scanner.upload_hint')}
					</p>
					<button
						type='button'
						onClick={onClose}
						className='mt-3 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer'
					>
						{t('scanner.close')}
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
