'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Preset, BarcodeType, CardUpdate } from '@/lib/types';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { useTranslation } from '@/context/LanguageContext';

interface EditCardModalProps {
	isOpen: boolean;
	card: Card;
	presets: Preset[];
	barcodeTypes: BarcodeType[];
	onClose: () => void;
	onSuccess?: (updatedCard: Card) => void;
}

export default function EditCardModal({
	isOpen,
	card,
	presets,
	barcodeTypes,
	onClose,
	onSuccess,
}: EditCardModalProps) {
	const router = useRouter();
	const { t } = useTranslation();

	const [cardName, setCardName] = useState(card.card_name || '');
	const [selectedPresetId, setSelectedPresetId] = useState<string>(
		card.company_preset_id ? card.company_preset_id.toString() : '',
	);
	const [barcodeTypeId, setBarcodeTypeId] = useState<string>(
		card.barcode_type_id ? card.barcode_type_id.toString() : '',
	);
	const [color, setColor] = useState(card.color_scheme || '#2563eb');
	const [code, setCode] = useState(card.code);
	const [isScannerOpen, setIsScannerOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	if (!isOpen) return null;

	function handlePresetChange(presetId: string) {
		setSelectedPresetId(presetId);
		if (presetId) {
			const preset = presets.find((p) => p.id.toString() === presetId);
			if (preset) {
				if (!cardName) setCardName(preset.name);
				if (!barcodeTypeId)
					setBarcodeTypeId(preset.barcode_type_id.toString());
				if (preset.color_scheme) setColor(preset.color_scheme);
			}
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!selectedPresetId && !barcodeTypeId) {
			setError(t('cards.barcode_type_required'));
			return;
		}

		setLoading(true);

		const payload: CardUpdate = {
			card_name: cardName,
			code,
			barcode_type_id: barcodeTypeId ? Number(barcodeTypeId) : null,
			company_preset_id: selectedPresetId
				? Number(selectedPresetId)
				: null,
			color_scheme: color || null,
		};

		try {
			const res = await fetch(`/api/cards/${card.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const updated = await res.json().catch(() => null);
				if (onSuccess && updated) {
					onSuccess(updated);
				} else if (onSuccess) {
					// Fallback local update if API doesn't return full object
					onSuccess({
						...card,
						card_name: cardName,
						code,
						barcode_type_id: barcodeTypeId
							? Number(barcodeTypeId)
							: null,
						company_preset_id: selectedPresetId
							? Number(selectedPresetId)
							: null,
						color_scheme: color || null,
					});
				}
				onClose();
				router.refresh();
			} else {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || t('cards.save_error'));
			}
		} catch {
			setError(t('common.network_error'));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in'>
			<div className='relative w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]'>
				<div className='p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800'>
					<h3 className='font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100'>
						{t('common.edit')}
					</h3>
					<button
						type='button'
						onClick={onClose}
						className='rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer'
					>
						✕
					</button>
				</div>

				<div className='overflow-y-auto p-5'>
					{error && (
						<div className='mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								{t('cards.form.preset_label')}
							</label>
							<select
								value={selectedPresetId}
								onChange={(e) =>
									handlePresetChange(e.target.value)
								}
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							>
								<option value=''>
									{t('common.custom_no_preset')}
								</option>
								{presets.map((preset) => (
									<option key={preset.id} value={preset.id}>
										{preset.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								{t('cards.form.name_label')}
							</label>
							<input
								type='text'
								required
								value={cardName}
								onChange={(e) => setCardName(e.target.value)}
								placeholder={t('cards.form.name_placeholder')}
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								{t('cards.form.barcode_type_label')}
							</label>
							<select
								value={barcodeTypeId}
								onChange={(e) =>
									setBarcodeTypeId(e.target.value)
								}
								required={!selectedPresetId}
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							>
								{selectedPresetId && (
									<option value=''>
										{t('cards.form.use_preset_default')}
									</option>
								)}
								{barcodeTypes.map((bt) => (
									<option key={bt.id} value={bt.id}>
										{bt.code}{' '}
										{bt.numeric_only
											? `(${t('common.numeric')})`
											: `(${t('common.alphanumeric')})`}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								{t('cards.form.color_label')}
							</label>
							<div className='flex gap-2 items-center'>
								<input
									type='color'
									value={color}
									onChange={(e) => setColor(e.target.value)}
									className='h-10 w-10 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-1'
								/>
								<input
									type='text'
									value={color}
									onChange={(e) => setColor(e.target.value)}
									placeholder='#2563eb'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
						</div>

						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								{t('cards.form.code_label')}
							</label>
							<div className='flex gap-2'>
								<input
									type='text'
									required
									value={code}
									onChange={(e) => setCode(e.target.value)}
									placeholder={t(
										'cards.form.code_placeholder',
									)}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
								<button
									type='button'
									onClick={() => setIsScannerOpen(true)}
									className='flex items-center justify-center rounded-xl bg-blue-600 px-3.5 text-white hover:bg-blue-500 active:scale-95 transition cursor-pointer shrink-0'
									title={t('scanner.scan_barcode')}
								>
									<svg
										className='w-5 h-5'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 9h10M7 12h10M7 15h10'
										/>
									</svg>
								</button>
							</div>
						</div>

						<div className='flex gap-2 justify-end pt-3'>
							<button
								type='button'
								onClick={onClose}
								className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer'
							>
								{t('common.cancel')}
							</button>
							<button
								type='submit'
								disabled={loading}
								className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer'
							>
								{loading
									? t('common.saving')
									: t('common.save')}
							</button>
						</div>
					</form>
				</div>
			</div>

			<BarcodeScannerModal
				isOpen={isScannerOpen}
				onClose={() => setIsScannerOpen(false)}
				onScan={(scanned) => setCode(scanned)}
			/>
		</div>
	);
}
