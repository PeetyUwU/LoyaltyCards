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
		<div className='mx-auto max-w-md p-6'>
			<button
				onClick={() => router.back()}
				className='mb-4 text-sm text-gray-400'
			>
				← Back
			</button>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<h1 className='text-xl font-semibold'>Edit card</h1>

				{error && <p className='text-sm text-red-600'>{error}</p>}

				<div>
					<label className='block text-sm font-medium'>Name</label>
					<input
						value={cardName}
						onChange={(e) => setCardName(e.target.value)}
						required
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium'>
						Store preset
					</label>
					<select
						value={presetId}
						onChange={(e) => setPresetId(e.target.value)}
						className='mt-1 w-full rounded border px-3 py-2'
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
						<label className='block text-sm font-medium'>
							Barcode type
						</label>
						<select
							value={barcodeTypeId}
							onChange={(e) => setBarcodeTypeId(e.target.value)}
							required
							className='mt-1 w-full rounded border px-3 py-2'
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
					<label className='block text-sm font-medium'>Code</label>
					<input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium'>Color</label>
					<input
						value={colorScheme}
						onChange={(e) => setColorScheme(e.target.value)}
						placeholder='#00539F'
						className='mt-1 w-full rounded border px-3 py-2'
					/>
				</div>

				<button
					type='submit'
					disabled={saving}
					className='w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
				>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</form>
		</div>
	);
}
