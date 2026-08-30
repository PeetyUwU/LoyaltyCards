'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, SharedCard, Preset, BarcodeType } from '@/lib/types';
import BarcodeDisplay from '@/components/BarcodeDisplay';
import ConfirmModal from '@/components/ConfirmModal';
import EditCardClient from './[id]/edit/EditCardClient';
import ShareCardClient from './[id]/share/ShareCardClient';
import NewCardClient from './new/NewCardClient';
import { useTranslation } from '@/context/LanguageContext';

type UnifiedCard =
	| (Card & { access_level: 'owner' | 'editor' | 'viewer' })
	| SharedCard;

interface Props {
	initialCards: UnifiedCard[];
	presets: Preset[];
	barcodeTypes: BarcodeType[];
}

type ModalType = 'detail' | 'edit' | 'share' | 'new' | null;
type CodePosition = 'top' | 'center' | 'bottom';

export default function CardsListClient({
	initialCards,
	presets,
	barcodeTypes,
}: Props) {
	const [cards, setCards] = useState<UnifiedCard[]>(initialCards);
	const [activeCard, setActiveCard] = useState<UnifiedCard | null>(null);
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [position, setPosition] = useState<CodePosition>('top');
	const [deleting, setDeleting] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const { t } = useTranslation();

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

	function openModal(type: ModalType, card: UnifiedCard | null = null) {
		if (card) {
			setActiveCard(card);
		}
		setActiveModal(type);
		setError(null);
	}

	function closeModal() {
		setActiveModal(null);
		setActiveCard(null);
		setError(null);
	}

	function handleCardSaved(updatedCard: Card) {
		setCards((prev) =>
			prev.map((c) =>
				c.id === updatedCard.id
					? {
							...c,
							...updatedCard,
							access_level: c.access_level,
						}
					: c,
			),
		);
		setActiveCard((prev) =>
			prev && prev.id === updatedCard.id
				? { ...prev, ...updatedCard }
				: prev,
		);
		setActiveModal('detail');
		router.refresh();
	}

	function handleCardCreated(newCard: Card) {
		const unifiedNew: UnifiedCard = { ...newCard, access_level: 'owner' };
		setCards((prev) =>
			[...prev, unifiedNew].sort((a, b) =>
				a.card_name.localeCompare(b.card_name),
			),
		);
		setActiveCard(unifiedNew);
		setActiveModal('detail');
		router.refresh();
	}

	async function handleConfirmDelete() {
		if (!activeCard) return;
		setDeleting(true);
		setError(null);

		try {
			const res = await fetch(`/api/cards/${activeCard.id}`, {
				method: 'DELETE',
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || t('cards.delete_error'));
				setDeleting(false);
				setShowDeleteModal(false);
				return;
			}
			setCards((prev) => prev.filter((c) => c.id !== activeCard.id));
			setDeleting(false);
			setShowDeleteModal(false);
			closeModal();
			router.refresh();
		} catch {
			setError(t('common.generic_error'));
			setDeleting(false);
			setShowDeleteModal(false);
		}
	}

	const matchedPreset = activeCard
		? presets.find((p) => p.id === activeCard.company_preset_id)
		: null;
	const activeColor =
		activeCard?.color_scheme || matchedPreset?.color_scheme || null;
	const typeId =
		activeCard?.barcode_type_id || matchedPreset?.barcode_type_id;
	const matchedBarcodeType = barcodeTypes.find((bt) => bt.id === typeId);
	const barcodeTypeCode = matchedBarcodeType?.code || null;

	const canEdit =
		activeCard?.access_level === 'owner' ||
		activeCard?.access_level === 'editor';
	const canDelete = activeCard?.access_level === 'owner';
	const canShare = activeCard?.access_level === 'owner';

	const barcodeBox = activeCard && (
		<div
			className='w-full rounded-2xl p-3.5 sm:p-5 text-center shadow-inner transition-all duration-300 select-none'
			style={{
				backgroundColor: activeColor
					? `${activeColor}18`
					: 'var(--card-bg)',
				borderColor: activeColor || 'var(--card-border)',
				borderWidth: '1px',
			}}
		>
			<div className='bg-white text-black p-3 sm:p-4 rounded-xl shadow-inner border border-zinc-200 flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-[1.01]'>
				<BarcodeDisplay
					code={activeCard.code}
					barcodeType={barcodeTypeCode}
				/>
			</div>
			<p className='font-mono text-xs sm:text-sm tracking-widest text-zinc-700 dark:text-zinc-300 mt-2.5 truncate'>
				{activeCard.code}
			</p>
		</div>
	);

	const bottomControls = activeCard && (
		<div className='w-full space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 pb-[env(safe-area-inset-bottom,0px)]'>
			{matchedPreset && (
				<p className='text-xs text-center text-zinc-500 font-medium'>
					{matchedPreset.name}
				</p>
			)}

			{activeCard.access_level !== 'owner' && (
				<div className='text-center'>
					<span className='inline-block rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400'>
						{t('common.shared_as', {
							role: activeCard.access_level,
						})}
					</span>
				</div>
			)}

			{error && (
				<p className='text-xs text-red-500 text-center'>{error}</p>
			)}

			<div className='flex gap-2'>
				{canEdit && (
					<button
						type='button'
						onClick={() => openModal('edit')}
						className='flex-1 min-w-[70px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95 transition-all duration-150'
					>
						{t('common.edit')}
					</button>
				)}
				{canShare && (
					<button
						type='button'
						onClick={() => openModal('share')}
						className='flex-1 min-w-[70px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95 transition-all duration-150'
					>
						{t('common.share')}
					</button>
				)}
				{canDelete && (
					<button
						type='button'
						onClick={() => setShowDeleteModal(true)}
						className='flex-1 min-w-[70px] rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-95 transition-all duration-150'
					>
						{t('common.delete')}
					</button>
				)}
			</div>
		</div>
	);

	return (
		<div className='mx-auto max-w-4xl px-4 py-6 sm:px-6'>
			<div className='mb-6 flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>
						{t('cards.title')}
					</h1>
					<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5'>
						{cards.length === 1
							? t('cards.count_single')
							: t('cards.count_multiple', {
									count: cards.length,
								})}
					</p>
				</div>
				<button
					type='button'
					onClick={() => openModal('new')}
					className='inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition-all duration-150 cursor-pointer'
				>
					+ {t('cards.add_card')}
				</button>
			</div>

			{cards.length === 0 ? (
				<div className='rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center animate-fade-in'>
					<p className='text-sm text-zinc-500'>
						{t('cards.no_cards')}
					</p>
					<button
						type='button'
						onClick={() => openModal('new')}
						className='mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
					>
						{t('cards.create_first')}
					</button>
				</div>
			) : (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{cards.map((card, index) => (
						<div
							key={card.id}
							onClick={() => openModal('detail', card)}
							className='animate-card-item group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] cursor-pointer'
							style={{
								animationDelay: `${Math.min(index * 40, 300)}ms`,
								borderLeftWidth: card.color_scheme
									? '4px'
									: '1px',
								borderLeftColor: card.color_scheme || undefined,
							}}
						>
							<div>
								<div className='flex items-center justify-between gap-2'>
									<p className='font-semibold text-base truncate text-zinc-900 dark:text-zinc-100'>
										{card.card_name}
									</p>
									{card.access_level !== 'owner' && (
										<span className='rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 shrink-0'>
											{t('common.shared')}
										</span>
									)}
								</div>
								<p className='mt-2 font-mono text-sm tracking-wider text-zinc-600 dark:text-zinc-400 truncate'>
									{card.code}
								</p>
							</div>

							{card.access_level !== 'owner' && (
								<p className='mt-3 text-[11px] text-zinc-400 truncate'>
									{t('common.shared_by', {
										name:
											'shared_by_username' in card
												? (card.shared_by_username ??
													t('common.unknown'))
												: t('common.unknown'),
									})}
								</p>
							)}
						</div>
					))}
				</div>
			)}

			{/* DETAIL MODAL */}
			{activeCard && (
				<div
					className={`fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-opacity duration-200 ${
						activeModal === null || activeModal === 'new'
							? 'hidden opacity-0 pointer-events-none'
							: 'animate-fade-in'
					}`}
					onClick={(e) => {
						if (
							e.target === e.currentTarget &&
							activeModal === 'detail'
						) {
							closeModal();
						}
					}}
				>
					<div className='w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90dvh] flex flex-col justify-between sm:rounded-2xl border-0 sm:border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-2xl animate-slide-up-sheet sm:animate-slide-up pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]'>
						{/* Header with Card Name & Close */}
						<div className='flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 min-h-[44px] shrink-0'>
							<div className='flex items-center gap-2.5 min-w-0 flex-1 mr-2'>
								{activeColor && (
									<span
										className='h-4 w-4 rounded-full border border-black/10 shrink-0 transition-transform duration-200 hover:scale-110'
										style={{ backgroundColor: activeColor }}
									/>
								)}
								<h2 className='text-base sm:text-lg font-bold truncate text-zinc-900 dark:text-zinc-100'>
									{activeCard.card_name}
								</h2>
							</div>

							<button
								type='button'
								onClick={closeModal}
								className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 active:scale-90 transition-all duration-150 shrink-0'
							>
								✕
							</button>
						</div>

						{/* Barcode Display Area */}
						<div className='flex-1 flex flex-col justify-between py-4 min-h-0 overflow-y-auto sm:space-y-4 sm:justify-start'>
							{/* Mobile Barcode Position Shifts */}
							<div className='flex-1 flex flex-col sm:hidden transition-all duration-300 ease-out'>
								{position === 'top' && (
									<div className='mt-1 animate-fade-in'>
										{barcodeBox}
									</div>
								)}
								{position === 'center' && (
									<div className='my-auto animate-fade-in'>
										{barcodeBox}
									</div>
								)}
								{position === 'bottom' && (
									<div className='mt-auto mb-1 animate-fade-in'>
										{barcodeBox}
									</div>
								)}
							</div>

							{/* Desktop static layout */}
							<div className='hidden sm:block animate-fade-in'>
								{barcodeBox}
							</div>
						</div>

						{/* Mobile Barcode Position Switcher */}
						<div className='flex sm:hidden items-center justify-between py-2 px-1 mb-1 shrink-0'>
							<span className='text-xs font-medium text-zinc-500'>
								{t('cards.position_label')}
							</span>
							<div className='flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium'>
								{(
									[
										'top',
										'center',
										'bottom',
									] as CodePosition[]
								).map((pos) => (
									<button
										key={pos}
										type='button'
										onClick={() =>
											handlePositionChange(pos)
										}
										className={`px-2.5 py-1 rounded-lg capitalize transition-all duration-150 active:scale-95 ${
											position === pos
												? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
												: 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
										}`}
									>
										{t(`cards.position.${pos}`)}
									</button>
								))}
							</div>
						</div>

						{/* Action Buttons */}
						{bottomControls}
					</div>
				</div>
			)}

			{/* EDIT OVERLAY SHEET */}
			{activeModal === 'edit' && activeCard && (
				<div
					className='fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-fade-in'
					onClick={(e) => {
						if (e.target === e.currentTarget)
							setActiveModal('detail');
					}}
				>
					<div className='w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xl animate-slide-up-sheet sm:animate-slide-up pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] mb-0 sm:mb-auto'>
						<EditCardClient
							card={activeCard as Card}
							presets={presets}
							barcodeTypes={barcodeTypes}
							isModal={true}
							onSuccess={handleCardSaved}
							onCancel={() => setActiveModal('detail')}
						/>
					</div>
				</div>
			)}

			{/* SHARE OVERLAY SHEET */}
			{activeModal === 'share' && activeCard && (
				<div
					className='fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-fade-in'
					onClick={(e) => {
						if (e.target === e.currentTarget)
							setActiveModal('detail');
					}}
				>
					<div className='w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xl animate-slide-up-sheet sm:animate-slide-up pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] mb-0 sm:mb-auto'>
						<ShareCardClient
							card={activeCard as Card}
							isModal={true}
							onCancel={() => setActiveModal('detail')}
						/>
					</div>
				</div>
			)}

			{/* NEW MODAL */}
			{activeModal === 'new' && (
				<div
					className='fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in'
					onClick={(e) => {
						if (e.target === e.currentTarget) closeModal();
					}}
				>
					<div className='w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xl animate-slide-up-sheet sm:animate-slide-up pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] mb-0 sm:mb-auto'>
						<NewCardClient
							presets={presets}
							barcodeTypes={barcodeTypes}
							isModal={true}
							onSuccess={handleCardCreated}
							onCancel={closeModal}
						/>
					</div>
				</div>
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
