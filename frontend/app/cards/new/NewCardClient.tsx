'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Preset, BarcodeType } from '@/lib/types';

interface Props {
	presets: Preset[];
	barcodeTypes: BarcodeType[];
}

export default function NewCardClient({ presets, barcodeTypes }: Props) {
	const [cardName, setCardName] = useState('');
	const [code, setCode] = useState('');
	const [presetId, setPresetId] = useState<string>('');
	const [barcodeTypeId, setBarcodeTypeId] = useState<string>('');
	const [colorScheme, setColorScheme] = useState('#2563eb');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const router = useRouter();

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
				setError(data.detail || 'Failed to create card');
				setSaving(false);
				return;
			}

			const created = await res.json();
			router.push(`/cards/${created.id}`);
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
				<h1 className='text-xl font-bold tracking-tight'>Add Card</h1>

				{error && <p className='text-sm text-red-500'>{error}</p>}

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Card Name
					</label>
					<input
						value={cardName}
						onChange={(e) => setCardName(e.target.value)}
						required
						placeholder='e.g. Supermarket Club'
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Store Preset
					</label>
					<select
						value={presetId}
						onChange={(e) => setPresetId(e.target.value)}
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

				{selectedPreset && (
					<div className='rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-3 text-xs flex items-center justify-between'>
						<span className='text-zinc-500'>
							Preset color & barcode standard will be applied
							automatically
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
								Barcode Type
							</label>
							<select
								value={barcodeTypeId}
								onChange={(e) =>
									setBarcodeTypeId(e.target.value)
								}
								required
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							>
								<option value=''>Select a type</option>
								{barcodeTypes.map((bt) => (
									<option key={bt.id} value={bt.id}>
										{bt.code}{' '}
										{bt.numeric_only
											? '(Numeric)'
											: '(Alphanumeric)'}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
								Card Color
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
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
						</div>
					</>
				)}

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						Code Value
					</label>
					<input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
						placeholder='e.g. 123456789012'
						className='w-full font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<button
					type='submit'
					disabled={saving}
					className='mt-2 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 transition'
				>
					{saving ? 'Creating...' : 'Create Card'}
				</button>
			</form>
		</div>
	);
}
