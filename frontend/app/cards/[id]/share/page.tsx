import { apiFetch } from '@/lib/api';
import { Card } from '@/lib/types';
import ShareCardClient from './ShareCardClient';

export default async function ShareCardPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const card = await apiFetch<Card>(`/cards/${id}`);

	return <ShareCardClient card={card} />;
}
