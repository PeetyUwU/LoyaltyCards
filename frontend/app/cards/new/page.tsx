import { apiFetch } from '@/lib/api';
import { Preset, BarcodeType } from '@/lib/types';
import NewCardClient from './NewCardClient';

export default async function NewCardPage() {
	const [presets, barcodeTypes] = await Promise.all([
		apiFetch<Preset[]>('/presets/'),
		apiFetch<BarcodeType[]>('/barcode-types/'),
	]);

	return <NewCardClient presets={presets} barcodeTypes={barcodeTypes} />;
}
