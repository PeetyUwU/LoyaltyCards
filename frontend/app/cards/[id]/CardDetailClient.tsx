'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Preset, BarcodeType } from '@/lib/types';
import BarcodeDisplay from '@/components/BarcodeDisplay';
import ConfirmModal from '@/components/ConfirmModal';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
	card: Card;
	presets?: Preset[];
	barcodeTypes?: BarcodeType[];
	accessLevel: 'owner' | 'editor' | 'viewer';
}

type CodePosition = 'top' | 'center' | 'bottom';

export default function CardDetailClient({
	card,
	presets = [],
	barcodeTypes = [],
	accessLevel,
}: Props) {
	const [position, setPosition] = useState<CodePosition>('top');
	const [deleting, setDeleting] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { t } = useTranslation();

	const matchedPreset = presets.find((p) => p.id === card.company_preset_id);
	const activeColor =
		card.color_scheme || matchedPreset?.color_scheme || null;

	const typeId = card.barcode_type_id || matchedPreset?.barcode_type_id;
	const matchedBarcodeType = barcodeTypes.find((bt) => bt.id === typeId);
	const barcodeTypeCode = matchedBarcodeType?.code || null;

	useEffect(() => {
		const saved = localStorage.getItem(
			'card_code_position',
		) as CodePosition | null;
		if (saved === 'top' || saved === 'center' || saved === 'bottom') {
			setPosition(saved);
		}
	}, []);

	function handlePositionChange(newPos: CodePosition) {
		setPosition(newPos);
		localStorage.setItem('card_code_position', newPos);
	}

	const canEdit = accessLevel === 'owner' || accessLevel === 'editor';
	const canDelete = accessLevel === 'owner';
	const canShare = accessLevel === 'owner';

	async function handleConfirmDelete() {
		setDeleting(true);
		setError(null);

		try {
			const res = await fetch(`/api/cards/${card.id}`, {
				method: 'DELETE',
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || t('cards.delete_error'));
				setDeleting(false);
				setShowDeleteModal(false);
				return;
			}
			router.push('/cards');
			router.refresh();
		} catch {
			setError(t('common.generic_error'));
			setDeleting(false);
			setShowDeleteModal(false);
		}
	}

	const codeComponent = (
		<div
			className='w-full rounded-2xl p-4 sm:p-6 text-center shadow-md transition-all duration-200'
			style={{
				backgroundColor: activeColor
					? `${activeColor}15`
					: 'var(--card-bg)',
				borderColor: activeColor || 'var(--card-border)',
				borderWidth: '1px',
			}}
		>
			<div className='bg-white text-black p-3 sm:p-4 rounded-xl shadow-inner border border-zinc-200 flex items-center justify-center'>
				<BarcodeDisplay
					code={card.code}
					barcodeType={barcodeTypeCode}
				/>
			</div>
		</div>
	);

	const detailsComponent = (
		<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
			<div className='flex items-start justify-between'>
				<div>
					<h1 className='text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
						{card.card_name}
					</h1>
					{matchedPreset && (
						<p className='text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium'>
							{matchedPreset.name}
						</p>
					)}
					{accessLevel !== 'owner' && (
						<span className='inline-block mt-2 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400'>
							{t('common.shared_as', { role: accessLevel })}
						</span>
					)}
				</div>
				{activeColor && (
					<span
						className='h-6 w-6 rounded-full border border-black/10 shrink-0 mt-1 shadow-sm'
						style={{ backgroundColor: activeColor }}
					/>
				)}
			</div>

			{error && <p className='mt-4 text-sm text-red-500'>{error}</p>}

			<div className='mt-6 flex flex-wrap gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4'>
				{canEdit && (
					<button
						type='button'
						onClick={() => router.push(`/cards/${card.id}/edit`)}
						className='flex-1 min-w-[80px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
					>
						{t('common.edit')}
					</button>
				)}
				{canShare && (
					<button
						type='button'
						onClick={() => router.push(`/cards/${card.id}/share`)}
						className='flex-1 min-w-[80px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
					>
						{t('common.share')}
					</button>
				)}
				{canDelete && (
					<button
						type='button'
						onClick={() => setShowDeleteModal(true)}
						disabled={deleting}
						className='flex-1 min-w-[80px] rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition'
					>
						{t('common.delete')}
					</button>
				)}
			</div>
		</div>
	);

	return (
		<div className='mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col justify-between px-4 py-4 sm:py-6'>
			<div className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<button
						type='button'
						onClick={() => router.push('/cards')}
						className='flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors'
					>
						← {t('common.back')}
					</button>

					<div className='flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg text-xs font-medium'>
						{(['top', 'center', 'bottom'] as CodePosition[]).map(
							(pos) => (
								<button
									key={pos}
									type='button'
									onClick={() => handlePositionChange(pos)}
									className={`px-2.5 py-1 rounded-md capitalize transition-all ${
										position === pos
											? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
											: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
									}`}
								>
									{t(`cards.position.${pos}`)}
								</button>
							),
						)}
					</div>
				</div>

				{position === 'top' && codeComponent}
				{detailsComponent}
				{position === 'center' && codeComponent}
			</div>

			{position === 'bottom' && (
				<div className='mt-auto pt-6 pb-2'>{codeComponent}</div>
			)}

			<ConfirmModal
				isOpen={showDeleteModal}
				title={t('common.delete')}
				message={t('cards.delete_confirm')}
				confirmText={t('common.delete')}
				isDestructive={true}
				isLoading={deleting}
				onConfirm={handleConfirmDelete}
				onCancel={() => setShowDeleteModal(false)}
			/>
		</div>
	);
}
