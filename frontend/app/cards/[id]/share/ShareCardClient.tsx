'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardAccessOut, User } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
	card: Card;
	isModal?: boolean;
	onCancel?: () => void;
}

export default function ShareCardClient({
	card,
	isModal = false,
	onCancel,
}: Props) {
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
	const { t } = useTranslation();

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
				setError(data.detail || t('share_card.update_role_error'));
			}
		} catch {
			setError(t('common.generic_error'));
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
				setError(data.detail || t('share_card.remove_access_error'));
			}
		} catch {
			setError(t('common.generic_error'));
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
			setError(
				t('share_card.error_failed_users', {
					users: failed.join(', '),
				}),
			);
		} else {
			setSuccess(
				selectedUsers.length === 1
					? t('share_card.success_single')
					: t('share_card.success_multiple', {
							count: selectedUsers.length,
						}),
			);
			setSelectedUsers([]);
			loadAccess();
		}
		setSaving(false);
	}

	return (
		<div
			className={
				isModal ? 'w-full space-y-4' : 'mx-auto max-w-md p-6 space-y-4'
			}
		>
			{!isModal && (
				<button
					type='button'
					onClick={() => router.back()}
					className='text-sm text-gray-400 hover:text-white'
				>
					← {t('common.back')}
				</button>
			)}

			<div className='flex items-center justify-between'>
				<h1 className='text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate'>
					{t('share_card.title', { name: card.card_name })}
				</h1>
				{isModal && onCancel && (
					<button
						type='button'
						onClick={onCancel}
						className='rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
					>
						✕
					</button>
				)}
			</div>

			{error && <p className='text-xs text-red-500'>{error}</p>}
			{success && <p className='text-xs text-green-500'>{success}</p>}

			<div className='space-y-4'>
				<div ref={containerRef} className='relative'>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						{t('share_card.add_people')}
					</label>

					{selectedUsers.length > 0 && (
						<div className='mb-2 flex flex-wrap gap-1.5'>
							{selectedUsers.map((u) => (
								<span
									key={u.id}
									className='flex items-center gap-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-800 dark:text-zinc-200'
								>
									{u.username}
									<button
										type='button'
										onClick={() => removeUser(u.id)}
										className='text-zinc-400 hover:text-red-500'
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
						placeholder={t('share_card.search_placeholder')}
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>

					{showSuggestions && suggestions.length > 0 && (
						<ul className='absolute z-20 mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-lg max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-700/50'>
							{suggestions.map((u) => (
								<li key={u.id}>
									<button
										type='button'
										onClick={() => addUser(u)}
										className='w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100'
									>
										{u.username}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<div>
					<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
						{t('share_card.access_level')}
					</label>
					<select
						value={accessLevel}
						onChange={(e) =>
							setAccessLevel(
								e.target.value as 'editor' | 'viewer',
							)
						}
						className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						<option value='viewer'>{t('share_card.viewer')}</option>
						<option value='editor'>{t('share_card.editor')}</option>
					</select>
				</div>

				<button
					type='button'
					onClick={handleShare}
					disabled={selectedUsers.length === 0 || saving}
					className='w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
				>
					{saving
						? t('share_card.sharing')
						: selectedUsers.length > 0
							? t('share_card.share_with_count', {
									count: selectedUsers.length,
								})
							: t('share_card.share_btn')}
				</button>

				{currentAccess.length > 0 && (
					<div className='pt-3 border-t border-zinc-200 dark:border-zinc-800'>
						<h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2'>
							{t('share_card.people_with_access')}
						</h2>
						<ul className='space-y-2 max-h-40 overflow-y-auto'>
							{currentAccess.map((access) => (
								<li
									key={access.user_id}
									className='flex items-center justify-between gap-2 text-xs py-1 rounded-lg px-2 bg-zinc-50 dark:bg-zinc-800/50'
								>
									<span className='truncate font-medium text-zinc-800 dark:text-zinc-200'>
										{usersById.get(access.user_id) ||
											t('share_card.user_fallback', {
												id: access.user_id,
											})}
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
											className='rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs focus:outline-none disabled:opacity-50'
										>
											<option value='viewer'>
												{t('share_card.viewer')}
											</option>
											<option value='editor'>
												{t('share_card.editor')}
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
												? t('common.removing')
												: t('common.remove')}
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
