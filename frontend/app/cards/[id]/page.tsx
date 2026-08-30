import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Card, Preset, BarcodeType } from '@/lib/types';
import CardDetailClient from './CardDetailClient';

export default async function CardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	let card: Card;
	let presets: Preset[] = [];
	let barcodeTypes: BarcodeType[] = [];

	try {
		const [cardRes, presetsRes, barcodeTypesRes] = await Promise.all([
			apiFetch<Card>(`/cards/${id}`),
			apiFetch<Preset[]>('/presets/').catch(() => []),
			apiFetch<BarcodeType[]>('/barcode-types/').catch(() => []),
		]);
		card = cardRes;
		presets = presetsRes;
		barcodeTypes = barcodeTypesRes;
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
			if (match)
				accessLevel = match.access_level as
					| 'owner'
					| 'editor'
					| 'viewer';
		}
	} catch {}

	return (
		<CardDetailClient
			card={card}
			presets={presets}
			barcodeTypes={barcodeTypes}
			accessLevel={accessLevel}
		/>
	);
}
