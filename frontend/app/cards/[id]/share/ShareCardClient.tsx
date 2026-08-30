'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
	const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);

	const fetchUsers = useCallback(
		(searchQuery: string, signal?: AbortSignal) => {
			fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`, { signal })
				.then((res) => (res.ok ? res.json() : []))
				.then((data: User[]) => {
					const excludedUserIds = new Set([
						...selectedUsers.map((u) => u.id),
						...currentAccess.map((a) => a.user_id),
					]);

					const filtered = (Array.isArray(data) ? data : [])
						.filter((u) => !excludedUserIds.has(u.id))
						.sort((a, b) => a.username.localeCompare(b.username));
					setSuggestions(filtered);
				})
				.catch((err) => {
					if (err.name !== 'AbortError') {
						setSuggestions([]);
					}
				});
		},
		[selectedUsers, currentAccess],
	);

	useEffect(() => {
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			fetchUsers(query, controller.signal);
		}, 200);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [query, fetchUsers]);

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

	const loadAccess = useCallback(async () => {
		try {
			const res = await fetch(`/api/cards/${card.id}/access`);
			if (!res.ok) return;

			const access: CardAccessOut[] = await res.json();
			const nonOwner = (Array.isArray(access) ? access : []).filter(
				(a) => a.access_level !== 'owner',
			);
			setCurrentAccess(nonOwner);

			if (nonOwner.length > 0) {
				const usersRes = await fetch(`/api/users?q=`);
				if (usersRes.ok) {
					const allUsers: User[] = await usersRes.json();
					setUsersById(
						new Map(allUsers.map((u) => [u.id, u.username])),
					);
				}
			}
		} catch {}
	}, [card.id]);

	useEffect(() => {
		loadAccess();
	}, [loadAccess]);

	async function handleUpdateRole(
		userId: number,
		newRole: 'editor' | 'viewer',
	) {
		setUpdatingUserId(userId);
		setError(null);
		try {
			const res = await fetch(`/api/cards/${card.id}/share`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: userId,
					access_level: newRole,
				}),
			});

			if (res.ok) {
				setCurrentAccess((prev) =>
					prev.map((a) =>
						a.user_id === userId
							? { ...a, access_level: newRole }
							: a,
					),
				);
			} else {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to update access level');
			}
		} catch {
			setError('Something went wrong.');
		} finally {
			setUpdatingUserId(null);
		}
	}

	async function handleRevoke(userId: number) {
		setRevoking(userId);
		setError(null);
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
		} finally {
			setRevoking(null);
		}
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
			selectedUsers.map(async (u) => {
				const res = await fetch(`/api/cards/${card.id}/share`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						user_id: u.id,
						access_level: accessLevel,
					}),
				});
				if (!res.ok) throw new Error(u.username);
			}),
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
			loadAccess();
		}
		setSaving(false);
	}

	return (
		<div className='mx-auto max-w-md p-6'>
			<button
				type='button'
				onClick={() => router.back()}
				className='mb-4 text-sm text-gray-400 hover:text-white'
			>
				← Back
			</button>

			<h1 className='mb-4 text-xl font-semibold'>
				Share &quot;{card.card_name}&quot;
			</h1>

			{error && <p className='mb-3 text-sm text-red-500'>{error}</p>}
			{success && (
				<p className='mb-3 text-sm text-green-500'>{success}</p>
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
										type='button'
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
						onFocus={() => {
							setShowSuggestions(true);
							fetchUsers(query);
						}}
						placeholder='Search by username...'
						className='mt-2 w-full rounded border px-3 py-2 bg-transparent'
					/>

					{showSuggestions && suggestions.length > 0 && (
						<ul className='absolute z-10 mt-1 w-full rounded border bg-neutral-900 shadow-lg max-h-48 overflow-y-auto'>
							{suggestions.map((u) => (
								<li key={u.id}>
									<button
										type='button'
										onClick={() => addUser(u)}
										className='w-full px-3 py-2 text-left hover:bg-neutral-800 text-sm'
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
						className='mt-1 w-full rounded border px-3 py-2 bg-transparent'
					>
						<option value='viewer'>Viewer</option>
						<option value='editor'>Editor</option>
					</select>
				</div>

				<button
					type='button'
					onClick={handleShare}
					disabled={selectedUsers.length === 0 || saving}
					className='w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50'
				>
					{saving
						? 'Sharing...'
						: `Share${selectedUsers.length > 0 ? ` with ${selectedUsers.length}` : ''}`}
				</button>

				{currentAccess.length > 0 && (
					<div className='pt-4 border-t'>
						<h2 className='text-sm font-medium mb-2'>
							People with access
						</h2>
						<ul className='space-y-3'>
							{currentAccess.map((access) => (
								<li
									key={access.user_id}
									className='flex items-center justify-between gap-3 text-sm py-1'
								>
									<span className='truncate'>
										{usersById.get(access.user_id) ||
											`User #${access.user_id}`}
									</span>
									<div className='flex items-center gap-2 shrink-0'>
										<select
											value={access.access_level}
											disabled={
												updatingUserId ===
												access.user_id
											}
											onChange={(e) =>
												handleUpdateRole(
													access.user_id,
													e.target.value as
														| 'editor'
														| 'viewer',
												)
											}
											className='rounded border px-2 py-1 text-xs bg-transparent disabled:opacity-50'
										>
											<option value='viewer'>
												Viewer
											</option>
											<option value='editor'>
												Editor
											</option>
										</select>
										<button
											type='button'
											onClick={() =>
												handleRevoke(access.user_id)
											}
											disabled={
												revoking === access.user_id
											}
											className='text-xs text-red-500 hover:underline disabled:opacity-50'
										>
											{revoking === access.user_id
												? 'Removing...'
												: 'Remove'}
										</button>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
