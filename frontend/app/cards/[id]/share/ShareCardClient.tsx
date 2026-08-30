'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardAccessOut, User } from '@/lib/types';

export default function ShareCardClient({ card }: { card: Card }) {
	const [query, setQuery] = useState('');
	const [suggestions, setSuggestions] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
	const [accessLevel, setAccessLevel] = useState<'editor' | 'viewer'>(
		'viewer',
	);
	const [currentAccess, setCurrentAccess] = useState<CardAccessOut[]>([]);
	const [usersById, setUsersById] = useState<Map<number, string>>(new Map());
	const [revoking, setRevoking] = useState<number | null>(null);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			fetch(`/api/users?q=${encodeURIComponent(query)}`, {
				signal: controller.signal,
			})
				.then((res) => res.json())
				.then((data: User[]) => {
					const alreadySelected = new Set(
						selectedUsers.map((u) => u.id),
					);
					const filtered = (Array.isArray(data) ? data : []).filter(
						(u) => !alreadySelected.has(u.id),
					);
					filtered.sort((a, b) =>
						a.username.localeCompare(b.username),
					);
					setSuggestions(filtered);
				})
				.catch(() => {});
		}, 200);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [query, selectedUsers]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		fetch(`/api/cards/${card.id}/access`)
			.then((res) => res.json())
			.then(async (access: CardAccessOut[]) => {
				const nonOwner = access.filter(
					(a) => a.access_level !== 'owner',
				);
				setCurrentAccess(nonOwner);

				// resolve usernames for display
				const ids = nonOwner.map((a) => a.user_id);
				if (ids.length > 0) {
					const results = await Promise.all(
						ids.map((id) =>
							fetch(`/api/users?q=`).then((r) => r.json()),
						),
					);
					// simpler: fetch all users once and build a lookup map
					const allUsers: User[] = await fetch(`/api/users?q=`).then(
						(r) => r.json(),
					);
					const map = new Map(
						allUsers.map((u) => [u.id, u.username]),
					);
					setUsersById(map);
				}
			})
			.catch(() => {});
	}, [card.id]);

	async function handleRevoke(userId: number) {
		setRevoking(userId);
		try {
			const res = await fetch(
				`/api/cards/${card.id}/share?user_id=${userId}`,
				{
					method: 'DELETE',
				},
			);
			if (res.ok) {
				setCurrentAccess((prev) =>
					prev.filter((a) => a.user_id !== userId),
				);
			} else {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to remove access');
			}
		} catch {
			setError('Something went wrong.');
		}
		setRevoking(null);
	}

	function addUser(user: User) {
		setSelectedUsers((prev) => [...prev, user]);
		setQuery('');
		setSuggestions([]);
		setShowSuggestions(false);
	}

	function removeUser(userId: number) {
		setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
	}

	async function handleShare() {
		if (selectedUsers.length === 0) return;
		setError(null);
		setSuccess(null);
		setSaving(true);

		const results = await Promise.allSettled(
			selectedUsers.map((u) =>
				fetch(`/api/cards/${card.id}/share`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						user_id: u.id,
						access_level: accessLevel,
					}),
				}).then((res) => {
					if (!res.ok) throw new Error(u.username);
				}),
			),
		);

		const failed = results
			.map((r, i) =>
				r.status === 'rejected' ? selectedUsers[i].username : null,
			)
			.filter(Boolean);

		if (failed.length > 0) {
			setError(`Failed to share with: ${failed.join(', ')}`);
		} else {
			setSuccess(
				`Shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`,
			);
			setSelectedUsers([]);
		}
		setSaving(false);
	}

	return (
		<div className='mx-auto max-w-md p-6'>
			<button
				onClick={() => router.back()}
				className='mb-4 text-sm text-gray-400'
			>
				← Back
			</button>

			<h1 className='mb-4 text-xl font-semibold'>
				Share &quot;{card.card_name}&quot;
			</h1>

			{error && <p className='mb-3 text-sm text-red-600'>{error}</p>}
			{success && (
				<p className='mb-3 text-sm text-green-600'>{success}</p>
			)}

			<div className='space-y-4'>
				<div ref={containerRef} className='relative'>
					<label className='block text-sm font-medium'>
						Add people
					</label>

					{selectedUsers.length > 0 && (
						<div className='mt-2 flex flex-wrap gap-2'>
							{selectedUsers.map((u) => (
								<span
									key={u.id}
									className='flex items-center gap-1 rounded-full border px-3 py-1 text-sm'
								>
									{u.username}
									<button
										onClick={() => removeUser(u.id)}
										className='text-gray-400 hover:text-red-500'
										aria-label={`Remove ${u.username}`}
									>
										×
									</button>
								</span>
							))}
						</div>
					)}

					<input
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setShowSuggestions(true);
						}}
						onFocus={() => setShowSuggestions(true)}
						placeholder='Search by username...'
						className='mt-2 w-full rounded border px-3 py-2'
					/>

					{showSuggestions && suggestions.length > 0 && (
						<ul className='absolute z-10 mt-1 w-full rounded border bg-black shadow-lg'>
							{suggestions.map((u) => (
								<li key={u.id}>
									<button
										onClick={() => addUser(u)}
										className='w-full px-3 py-2 text-left hover:bg-gray-800'
									>
										{u.username}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<div>
					<label className='block text-sm font-medium'>
						Access level
					</label>
					<select
						value={accessLevel}
						onChange={(e) =>
							setAccessLevel(
								e.target.value as 'editor' | 'viewer',
							)
						}
						className='mt-1 w-full rounded border px-3 py-2'
					>
						<option value='viewer'>Viewer</option>
						<option value='editor'>Editor</option>
					</select>
				</div>

				<button
					onClick={handleShare}
					disabled={selectedUsers.length === 0 || saving}
					className='w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
				>
					{saving
						? 'Sharing...'
						: `Share with ${selectedUsers.length || ''}`}
				</button>
			</div>
		</div>
	);
}
