import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Card } from '@/lib/types';
import CardDetailClient from './CardDetailClient';

export default async function CardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	let card: Card;
	try {
		card = await apiFetch<Card>(`/cards/${id}`);
	} catch {
		notFound();
	}

	let accessLevel: 'owner' | 'editor' | 'viewer' = 'viewer';
	try {
		const mine = await apiFetch<Card[]>('/cards/mine');
		if (mine.some((c) => c.id === card.id)) {
			accessLevel = 'owner';
		} else {
			const shared =
				await apiFetch<(Card & { access_level: string })[]>(
					'/cards/shared',
				);
			const match = shared.find((c) => c.id === card.id);
			if (match) accessLevel = match.access_level as 'editor' | 'viewer';
		}
	} catch {}

	return <CardDetailClient card={card} accessLevel={accessLevel} />;
}
