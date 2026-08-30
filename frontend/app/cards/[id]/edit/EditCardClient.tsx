'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Preset, BarcodeType } from '@/lib/types';

interface Props {
	card: Card;
	presets: Preset[];
	barcodeTypes: BarcodeType[];
}

export default function EditCardClient({ card, presets, barcodeTypes }: Props) {
	const [cardName, setCardName] = useState(card.card_name);
	const [code, setCode] = useState(card.code);
	const [presetId, setPresetId] = useState<string>(
		card.company_preset_id?.toString() ?? '',
	);
	const [barcodeTypeId, setBarcodeTypeId] = useState<string>(
		card.barcode_type_id?.toString() ?? '',
	);
	const [colorScheme, setColorScheme] = useState(card.color_scheme ?? '');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const router = useRouter();

	function handlePresetChange(selectedId: string) {
		setPresetId(selectedId);
		if (selectedId) {
			const matched = presets.find((p) => p.id === Number(selectedId));
			if (matched?.color_scheme) {
				setColorScheme(matched.color_scheme);
			}
		}
	}

	const selectedPreset = presets.find((p) => p.id === Number(presetId));
	const effectivePickerColor =
		colorScheme || selectedPreset?.color_scheme || '#2563eb';

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSaving(true);

		try {
			const res = await fetch(`/api/cards/${card.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					card_name: cardName,
					code,
					company_preset_id: presetId ? Number(presetId) : null,
					barcode_type_id: barcodeTypeId
						? Number(barcodeTypeId)
						: null,
					color_scheme: colorScheme || null,
				}),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to save');
				setSaving(false);
				return;
			}

			router.push(`/cards/${card.id}`);
			router.refresh();
		} catch {
			setError('Something went wrong. Try again.');
			setSaving(false);
		}
	}

	return (
		<div className='mx-auto max-w-lg px-4 py-6 sm:px-6'>
			<button
				type='button'
				onClick={() => router.back()}
				className='mb-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition'
			>
				← Back
			</button>

			<form
				onSubmit={handleSubmit}
				className='space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'
			>
				<h1 className='text-xl font-bold tracking-tight'>Edit Card</h1>

				{error && <p className='text-sm text-red-500'>{error}</p>}

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Card Name
					</label>
					<input
						value={cardName}
						onChange={(e) => setCardName(e.target.value)}
						required
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Store Preset
					</label>
					<select
						value={presetId}
						onChange={(e) => handlePresetChange(e.target.value)}
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						<option value=''>Custom (no preset)</option>
						{presets.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				{!presetId && (
					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
							Barcode Type
						</label>
						<select
							value={barcodeTypeId}
							onChange={(e) => setBarcodeTypeId(e.target.value)}
							required
							className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						>
							<option value=''>Select a type</option>
							{barcodeTypes.map((bt) => (
								<option key={bt.id} value={bt.id}>
									{bt.code}
								</option>
							))}
						</select>
					</div>
				)}

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Code Value
					</label>
					<input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
						className='w-full font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Card Color
					</label>
					<div className='flex gap-2 items-center'>
						<input
							type='color'
							value={effectivePickerColor}
							onChange={(e) => setColorScheme(e.target.value)}
							className='h-10 w-10 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-1'
						/>
						<input
							value={colorScheme}
							onChange={(e) => setColorScheme(e.target.value)}
							placeholder={
								selectedPreset?.color_scheme || '#2563eb'
							}
							className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
				</div>

				<button
					type='submit'
					disabled={saving}
					className='mt-2 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 transition'
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</form>
		</div>
	);
}
