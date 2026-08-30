import { apiFetch } from '@/lib/api';
import { Card, Preset, BarcodeType } from '@/lib/types';
import EditCardClient from './EditCardClient';

export default async function EditCardPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [card, presets, barcodeTypes] = await Promise.all([
		apiFetch<Card>(`/cards/${id}`),
		apiFetch<Preset[]>('/presets/'),
		apiFetch<BarcodeType[]>('/barcode-types/'),
	]);

	return (
		<EditCardClient
			card={card}
			presets={presets}
			barcodeTypes={barcodeTypes}
		/>
	);
}
