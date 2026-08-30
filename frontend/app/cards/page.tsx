import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Card, SharedCard } from '@/lib/types';

type UnifiedCard = (Card & { access_level: 'owner' }) | SharedCard;

export default async function CardsPage() {
	const [myCards, sharedCards] = await Promise.all([
		apiFetch<Card[]>('/cards/mine'),
		apiFetch<SharedCard[]>('/cards/shared'),
	]);

	const allCards: UnifiedCard[] = [
		...myCards.map((c) => ({ ...c, access_level: 'owner' as const })),
		...sharedCards,
	].sort((a, b) => a.card_name.localeCompare(b.card_name));

	return (
		<div className='mx-auto max-w-4xl px-4 py-6 sm:px-6'>
			<div className='mb-6 flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>Cards</h1>
					<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5'>
						{allCards.length}{' '}
						{allCards.length === 1 ? 'card' : 'cards'} available
					</p>
				</div>
				<Link
					href='/cards/new'
					className='inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition'
				>
					+ Add Card
				</Link>
			</div>

			{allCards.length === 0 ? (
				<div className='rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center'>
					<p className='text-sm text-zinc-500'>No cards yet.</p>
					<Link
						href='/cards/new'
						className='mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline'
					>
						Create your first card
					</Link>
				</div>
			) : (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{allCards.map((card) => (
						<Link
							key={card.id}
							href={`/cards/${card.id}`}
							className='group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition active:scale-[0.98]'
							style={{
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
											Shared
										</span>
									)}
								</div>
								<p className='mt-2 font-mono text-sm tracking-wider text-zinc-600 dark:text-zinc-400 truncate'>
									{card.code}
								</p>
							</div>

							{card.access_level !== 'owner' && (
								<p className='mt-3 text-[11px] text-zinc-400 truncate'>
									Shared by{' '}
									{'shared_by_username' in card
										? (card.shared_by_username ?? 'unknown')
										: 'unknown'}
								</p>
							)}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
