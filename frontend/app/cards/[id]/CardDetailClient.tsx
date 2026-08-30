'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/lib/types';

interface Props {
	card: Card;
	accessLevel: 'owner' | 'editor' | 'viewer';
}

export default function CardDetailClient({ card, accessLevel }: Props) {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const canEdit = accessLevel === 'owner' || accessLevel === 'editor';
	const canDelete = accessLevel === 'owner';
	const canShare = accessLevel === 'owner';

	async function handleDelete() {
		if (!confirm("Delete this card? This can't be undone.")) return;
		setDeleting(true);
		setError(null);

		try {
			const res = await fetch(`/api/cards/${card.id}`, {
				method: 'DELETE',
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to delete card');
				setDeleting(false);
				return;
			}
			router.push('/cards');
			router.refresh();
		} catch {
			setError('Something went wrong. Try again.');
			setDeleting(false);
		}
	}

	return (
		<div className='mx-auto max-w-md p-6'>
			<button
				onClick={() => router.push('/cards')}
				className='mb-4 text-sm text-gray-400'
			>
				← Back
			</button>

			<div className='rounded border p-6'>
				<h1 className='text-xl font-semibold'>{card.card_name}</h1>
				<p className='mt-2 text-lg font-mono'>{card.code}</p>

				{accessLevel !== 'owner' && (
					<p className='mt-2 text-xs text-gray-400'>
						Access: {accessLevel} (shared with you)
					</p>
				)}

				{error && <p className='mt-3 text-sm text-red-600'>{error}</p>}

				<div className='mt-6 flex gap-2'>
					{canEdit && (
						<button
							onClick={() =>
								router.push(`/cards/${card.id}/edit`)
							}
							className='rounded border px-3 py-1.5 text-sm'
						>
							Edit
						</button>
					)}
					{canShare && (
						<button
							onClick={() =>
								router.push(`/cards/${card.id}/share`)
							}
							className='rounded border px-3 py-1.5 text-sm'
						>
							Share
						</button>
					)}
					{canDelete && (
						<button
							onClick={handleDelete}
							disabled={deleting}
							className='rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 disabled:opacity-50'
						>
							{deleting ? 'Deleting...' : 'Delete'}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
