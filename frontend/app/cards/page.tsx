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
		<div className='mx-auto max-w-2xl p-6'>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-2xl font-semibold'>My Cards</h1>
				<Link
					href='/cards/new'
					className='rounded bg-blue-600 px-3 py-1.5 text-sm text-white'
				>
					+ Add Card
				</Link>
			</div>

			{allCards.length === 0 ? (
				<p className='text-sm text-gray-500'>No cards yet.</p>
			) : (
				<ul className='space-y-2'>
					{allCards.map((card) => (
						<li key={card.id}>
							<Link
								href={`/cards/${card.id}`}
								className='block rounded border p-3 hover:bg-gray-900'
							>
								<p className='font-medium'>{card.card_name}</p>
								<p className='text-sm text-gray-500'>
									{card.code}
								</p>
								{card.access_level !== 'owner' && (
									<p className='text-xs text-gray-400'>
										Shared by{' '}
										{'shared_by_username' in card
											? (card.shared_by_username ??
												'unknown')
											: 'unknown'}
									</p>
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
