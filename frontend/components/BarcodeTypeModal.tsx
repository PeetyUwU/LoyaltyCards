'use client';

import { useState } from 'react';
import { BarcodeType } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

type LengthMode = 'any' | 'fixed' | 'range';

interface BarcodeTypeModalProps {
	barcodeType: BarcodeType | null;
	isLoading: boolean;
	onClose: () => void;
	onSubmit: (data: {
		code: string;
		numeric_only: boolean;
		fixed_length: number | null;
		min_length: number | null;
		max_length: number | null;
	}) => Promise<void>;
}

export default function BarcodeTypeModal({
	barcodeType,
	isLoading,
	onClose,
	onSubmit,
}: BarcodeTypeModalProps) {
	const { t } = useTranslation();
	const isEdit = Boolean(barcodeType);

	const [code, setCode] = useState(barcodeType?.code || '');
	const [numericOnly, setNumericOnly] = useState(
		Boolean(barcodeType?.numeric_only),
	);
	const [lengthMode, setLengthMode] = useState<LengthMode>(() => {
		if (
			barcodeType?.fixed_length !== null &&
			barcodeType?.fixed_length !== undefined
		) {
			return 'fixed';
		}
		if (
			(barcodeType?.min_length !== null &&
				barcodeType?.min_length !== undefined) ||
			(barcodeType?.max_length !== null &&
				barcodeType?.max_length !== undefined)
		) {
			return 'range';
		}
		return 'any';
	});

	const [fixedLength, setFixedLength] = useState(
		barcodeType?.fixed_length !== null &&
			barcodeType?.fixed_length !== undefined
			? String(barcodeType.fixed_length)
			: '',
	);
	const [minLength, setMinLength] = useState(
		barcodeType?.min_length !== null &&
			barcodeType?.min_length !== undefined
			? String(barcodeType.min_length)
			: '',
	);
	const [maxLength, setMaxLength] = useState(
		barcodeType?.max_length !== null &&
			barcodeType?.max_length !== undefined
			? String(barcodeType.max_length)
			: '',
	);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!code) return;

		const targetFixed =
			lengthMode === 'fixed' && fixedLength ? Number(fixedLength) : null;
		const targetMin =
			lengthMode === 'range' && minLength ? Number(minLength) : null;
		const targetMax =
			lengthMode === 'range' && maxLength ? Number(maxLength) : null;

		await onSubmit({
			code: code.trim().toUpperCase(),
			numeric_only: numericOnly,
			fixed_length: targetFixed,
			min_length: targetMin,
			max_length: targetMax,
		});
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
			<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
				<h3 className='text-lg font-bold'>
					{isEdit
						? t('admin.presets.edit_barcode_modal_title')
						: t('admin.presets.add_barcode_modal_title')}
				</h3>
				<p className='text-xs text-zinc-500 mt-1'>
					{isEdit
						? t('admin.presets.edit_barcode_modal_desc', {
								code: barcodeType?.code || '',
							})
						: t('admin.presets.add_barcode_modal_desc')}
				</p>

				<form onSubmit={handleSubmit} className='mt-4 space-y-4'>
					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
							{t('admin.presets.barcode_code_label')}
						</label>
						<input
							type='text'
							required
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder={t(
								'admin.presets.barcode_code_placeholder',
							)}
							className='w-full uppercase font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<label className='flex items-center gap-2 cursor-pointer pt-1'>
						<input
							type='checkbox'
							checked={numericOnly}
							onChange={(e) => setNumericOnly(e.target.checked)}
							className='h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-xs font-medium text-zinc-700 dark:text-zinc-300'>
							{t('admin.presets.numeric_only_label')}
						</span>
					</label>

					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5'>
							{t('admin.presets.length_mode_label')}
						</label>
						<div className='grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 p-1 bg-zinc-100/60 dark:bg-zinc-800/60 text-xs font-medium'>
							{(['any', 'fixed', 'range'] as LengthMode[]).map(
								(mode) => (
									<button
										key={mode}
										type='button'
										onClick={() => {
											setLengthMode(mode);
											if (mode === 'any') {
												setFixedLength('');
												setMinLength('');
												setMaxLength('');
											} else if (mode === 'fixed') {
												setMinLength('');
												setMaxLength('');
											} else {
												setFixedLength('');
											}
										}}
										className={`py-1.5 px-2 rounded-lg text-center transition-all ${
											lengthMode === mode
												? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
												: 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
										}`}
									>
										{t(`admin.presets.length_mode_${mode}`)}
									</button>
								),
							)}
						</div>
					</div>

					{lengthMode === 'fixed' && (
						<div className='animate-fade-in'>
							<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
								{t('admin.presets.fixed_length_label')}
							</label>
							<input
								type='number'
								min={1}
								value={fixedLength}
								onChange={(e) => setFixedLength(e.target.value)}
								placeholder='e.g. 13'
								className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					)}

					{lengthMode === 'range' && (
						<div className='grid grid-cols-2 gap-2 animate-fade-in'>
							<div>
								<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
									{t('admin.presets.min_length_label')}
								</label>
								<input
									type='number'
									min={1}
									value={minLength}
									onChange={(e) =>
										setMinLength(e.target.value)
									}
									placeholder='e.g. 8'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
							<div>
								<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
									{t('admin.presets.max_length_label')}
								</label>
								<input
									type='number'
									min={1}
									value={maxLength}
									onChange={(e) =>
										setMaxLength(e.target.value)
									}
									placeholder='e.g. 18'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
						</div>
					)}

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
									: t('admin.presets.create_barcode_btn')}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
