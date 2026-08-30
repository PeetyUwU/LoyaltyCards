import { apiFetch } from '@/lib/api';
import { Card, SharedCard, Preset, BarcodeType } from '@/lib/types';
import CardsListClient from './CardsListClient';

type UnifiedCard = (Card & { access_level: 'owner' }) | SharedCard;

export default async function CardsPage() {
	const [myCards, sharedCards, presets, barcodeTypes] = await Promise.all([
		apiFetch<Card[]>('/cards/mine'),
		apiFetch<SharedCard[]>('/cards/shared'),
		apiFetch<Preset[]>('/presets').catch(() => []),
		apiFetch<BarcodeType[]>('/barcode-types').catch(() => []),
	]);

	const allCards: UnifiedCard[] = [
		...myCards.map((c) => ({ ...c, access_level: 'owner' as const })),
		...sharedCards,
	].sort((a, b) => a.card_name.localeCompare(b.card_name));

	return (
		<CardsListClient
			initialCards={allCards}
			presets={presets}
			barcodeTypes={barcodeTypes}
		/>
	);
}
