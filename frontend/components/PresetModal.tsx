'use client';

import { useState } from 'react';
import { Preset, BarcodeType } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface PresetModalProps {
	preset: Preset | null;
	barcodeTypes: BarcodeType[];
	isLoading: boolean;
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		barcode_type_id: number;
		color_scheme: string | null;
		image_url: string;
	}) => Promise<void>;
}

export default function PresetModal({
	preset,
	barcodeTypes,
	isLoading,
	onClose,
	onSubmit,
}: PresetModalProps) {
	const { t } = useTranslation();
	const isEdit = Boolean(preset);

	const [name, setName] = useState(preset?.name || '');
	const [barcodeTypeId, setBarcodeTypeId] = useState(
		preset?.barcode_type_id.toString() ||
			barcodeTypes[0]?.id?.toString() ||
			'',
	);
	const [color, setColor] = useState(preset?.color_scheme || '#2563eb');
	const [imageUrl, setImageUrl] = useState(preset?.image_url || '');

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name || !barcodeTypeId) return;

		await onSubmit({
			name,
			barcode_type_id: Number(barcodeTypeId),
			color_scheme: color || null,
			image_url: imageUrl,
		});
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
			<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
				<h3 className='text-lg font-bold'>
					{isEdit
						? t('admin.presets.edit_modal_title')
						: t('admin.presets.add_modal_title')}
				</h3>
				<p className='text-xs text-zinc-500 mt-1'>
					{isEdit
						? t('admin.presets.edit_modal_desc', {
								name: preset?.name || '',
							})
						: t('admin.presets.add_modal_desc')}
				</p>

				<form onSubmit={handleSubmit} className='mt-4 space-y-4'>
					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
							{t('admin.presets.name_label')}
						</label>
						<input
							type='text'
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t('admin.presets.name_placeholder')}
							className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
							{t('admin.presets.barcode_standard_label')}
						</label>
						<select
							value={barcodeTypeId}
							onChange={(e) => setBarcodeTypeId(e.target.value)}
							required
							className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						>
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
							{t('admin.presets.default_color_label')}
						</label>
						<div className='flex gap-2 items-center'>
							<input
								type='color'
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className='h-10 w-10 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-1'
							/>
							<input
								value={color}
								onChange={(e) => setColor(e.target.value)}
								placeholder='#2563eb'
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					</div>

					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
							{isEdit
								? t('admin.presets.image_url_label')
								: t('admin.presets.image_url_label_optional')}
						</label>
						<input
							type='text'
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							placeholder={t(
								'admin.presets.image_url_placeholder',
							)}
							className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div className='flex gap-2 justify-end pt-2'>
						<button
							type='button'
							disabled={isLoading}
							onClick={onClose}
							className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition'
						>
							{t('common.cancel')}
						</button>
						<button
							type='submit'
							disabled={isLoading}
							className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
						>
							{isLoading
								? isEdit
									? t('common.saving')
									: t('admin.presets.creating_btn')
								: isEdit
									? t('common.save_changes')
									: t('admin.presets.create_btn')}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
