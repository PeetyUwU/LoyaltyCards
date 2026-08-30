'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Preset, BarcodeType } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
	presets: Preset[];
	barcodeTypes: BarcodeType[];
	isModal?: boolean;
	onSuccess?: (card: Card) => void;
	onCancel?: () => void;
}

export default function NewCardClient({
	presets,
	barcodeTypes,
	isModal = false,
	onSuccess,
	onCancel,
}: Props) {
	const [cardName, setCardName] = useState('');
	const [code, setCode] = useState('');
	const [presetId, setPresetId] = useState<string>('');
	const [barcodeTypeId, setBarcodeTypeId] = useState<string>('');
	const [colorScheme, setColorScheme] = useState('#2563eb');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const router = useRouter();
	const { t } = useTranslation();

	const selectedPreset = presets.find((p) => p.id === Number(presetId));

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSaving(true);

		try {
			const payload = presetId
				? {
						card_name: cardName,
						code,
						company_preset_id: Number(presetId),
						barcode_type_id: null,
						color_scheme: null,
					}
				: {
						card_name: cardName,
						code,
						company_preset_id: null,
						barcode_type_id: Number(barcodeTypeId),
						color_scheme: colorScheme,
					};

			const res = await fetch('/api/cards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || t('cards.create_error'));
				setSaving(false);
				return;
			}

			const created = await res.json();
			setSaving(false);

			if (onSuccess) {
				onSuccess(created);
			} else {
				router.push(`/cards/${created.id}`);
				router.refresh();
			}
		} catch {
			setError(t('common.generic_error'));
			setSaving(false);
		}
	}

	return (
		<div
			className={
				isModal ? 'w-full' : 'mx-auto max-w-lg px-4 py-6 sm:px-6'
			}
		>
			{!isModal && (
				<button
					type='button'
					onClick={() => router.back()}
					className='mb-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition'
				>
					← {t('common.back')}
				</button>
			)}

			<form
				onSubmit={handleSubmit}
				className={`space-y-4 ${
					isModal
						? ''
						: 'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'
				}`}
			>
				<div className='flex items-center justify-between'>
					<h1 className='text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
						{t('cards.add_card')}
					</h1>
					{isModal && onCancel && (
						<button
							type='button'
							onClick={onCancel}
							className='rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
						>
							✕
						</button>
					)}
				</div>

				{error && <p className='text-xs text-red-500'>{error}</p>}

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						{t('cards.form.name_label')}
					</label>
					<input
						value={cardName}
						onChange={(e) => setCardName(e.target.value)}
						required
						placeholder={t('cards.form.name_placeholder')}
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						{t('cards.form.preset_label')}
					</label>
					<select
						value={presetId}
						onChange={(e) => setPresetId(e.target.value)}
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						<option value=''>{t('common.custom_no_preset')}</option>
						{presets.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				{selectedPreset && (
					<div className='rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 p-3 text-xs flex items-center justify-between'>
						<span className='text-zinc-500'>
							{t('cards.form.preset_applied')}
						</span>
						{selectedPreset.color_scheme && (
							<span
								className='h-4 w-4 rounded-full border border-black/10 shrink-0'
								style={{
									backgroundColor:
										selectedPreset.color_scheme,
								}}
							/>
						)}
					</div>
				)}

				{!presetId && (
					<>
						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								{t('cards.form.barcode_type_label')}
							</label>
							<select
								value={barcodeTypeId}
								onChange={(e) =>
									setBarcodeTypeId(e.target.value)
								}
								required
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							>
								<option value=''>
									{t('common.select_type')}
								</option>
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
									value={colorScheme}
									onChange={(e) =>
										setColorScheme(e.target.value)
									}
									className='h-10 w-10 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-1'
								/>
								<input
									value={colorScheme}
									onChange={(e) =>
										setColorScheme(e.target.value)
									}
									required
									placeholder='#2563eb'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
						</div>
					</>
				)}

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						{t('cards.form.code_label')}
					</label>
					<input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
						placeholder={t('cards.form.code_placeholder')}
						className='w-full font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<div className='flex gap-2 pt-2'>
					{isModal && onCancel && (
						<button
							type='button'
							onClick={onCancel}
							className='flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
						>
							{t('common.cancel')}
						</button>
					)}
					<button
						type='submit'
						disabled={saving}
						className='flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 transition'
					>
						{saving ? t('cards.creating') : t('cards.create_card')}
					</button>
				</div>
			</form>
		</div>
	);
}
