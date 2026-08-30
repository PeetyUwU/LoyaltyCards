'use client';

import { Preset, BarcodeType } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface PresetsAndBarcodesTabProps {
	presets: Preset[];
	barcodeTypes: BarcodeType[];
	loadingAction: string | null;
	onOpenAddPreset: () => void;
	onOpenEditPreset: (preset: Preset) => void;
	onDeletePreset: (preset: Preset) => void;
	onOpenAddBarcode: () => void;
	onOpenEditBarcode: (barcodeType: BarcodeType) => void;
	onDeleteBarcode: (barcodeType: BarcodeType) => void;
}

export default function PresetsAndBarcodesTab({
	presets,
	barcodeTypes,
	loadingAction,
	onOpenAddPreset,
	onOpenEditPreset,
	onDeletePreset,
	onOpenAddBarcode,
	onOpenEditBarcode,
	onDeleteBarcode,
}: PresetsAndBarcodesTabProps) {
	const { t } = useTranslation();

	return (
		<div className='space-y-6 animate-fade-in'>
			{/* Presets Card */}
			<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-lg font-bold'>
						{t('admin.presets.title', {
							count: presets.length,
						})}
					</h2>
					<button
						type='button'
						onClick={onOpenAddPreset}
						className='rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition'
					>
						{t('admin.presets.add_btn')}
					</button>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
					{presets.map((preset) => (
						<div
							key={preset.id}
							className='flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-3 shadow-xs'
							style={{
								borderLeftWidth: preset.color_scheme
									? '4px'
									: '1px',
								borderLeftColor:
									preset.color_scheme || undefined,
							}}
						>
							<div className='truncate mr-2'>
								<p className='font-semibold text-sm truncate'>
									{preset.name}
								</p>
								<p className='text-xs text-zinc-400 font-mono mt-0.5'>
									{preset.color_scheme ||
										t('admin.presets.no_default_color')}
								</p>
							</div>
							<div className='flex items-center gap-1 shrink-0'>
								<button
									type='button'
									onClick={() => onOpenEditPreset(preset)}
									className='text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
								>
									{t('common.edit')}
								</button>
								<button
									type='button'
									disabled={
										loadingAction === `preset-${preset.id}`
									}
									onClick={() => onDeletePreset(preset)}
									className='text-xs text-red-500 hover:underline p-1 disabled:opacity-50'
								>
									{t('common.delete')}
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Barcode Standards Card */}
			<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-lg font-bold'>
						{t('admin.presets.standards_title', {
							count: barcodeTypes.length,
						})}
					</h2>
					<button
						type='button'
						onClick={onOpenAddBarcode}
						className='rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition'
					>
						{t('admin.presets.add_barcode_btn')}
					</button>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
					{barcodeTypes.map((bt) => (
						<div
							key={bt.id}
							className='flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-3 shadow-xs'
						>
							<div className='truncate mr-2'>
								<p className='font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100'>
									{bt.code}
								</p>
								<p className='text-[11px] text-zinc-400 mt-0.5'>
									{bt.numeric_only
										? t('admin.presets.numeric_only')
										: t('admin.presets.alphanumeric')}
									{bt.fixed_length !== null &&
									bt.fixed_length !== undefined
										? ` • ${t('admin.presets.fixed_len', { len: bt.fixed_length })}`
										: bt.min_length || bt.max_length
											? ` • ${t('admin.presets.min_max_len', { min: bt.min_length ?? '?', max: bt.max_length ?? '?' })}`
											: ''}
								</p>
							</div>
							<div className='flex items-center gap-1 shrink-0'>
								<button
									type='button'
									onClick={() => onOpenEditBarcode(bt)}
									className='text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
								>
									{t('common.edit')}
								</button>
								<button
									type='button'
									disabled={
										loadingAction === `barcode-${bt.id}`
									}
									onClick={() => onDeleteBarcode(bt)}
									className='text-xs text-red-500 hover:underline p-1 disabled:opacity-50'
								>
									{t('common.delete')}
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
