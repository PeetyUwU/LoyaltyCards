'use client';

import { useState } from 'react';
import { AdminUser } from '@/lib/types';

export default function AdminClient({
	initialUsers,
}: {
	initialUsers: AdminUser[];
}) {
	const [users, setUsers] = useState<AdminUser[]>(initialUsers);
	const [error, setError] = useState<string | null>(null);

	const [newUsername, setNewUsername] = useState('');
	const [newEmail, setNewEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [newRole, setNewRole] = useState('user');
	const [creating, setCreating] = useState(false);

	async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setCreating(true);

		try {
			const res = await fetch('/api/users/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: newUsername,
					email: newEmail,
					password: newPassword,
					role_name: newRole,
				}),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to create user');
				setCreating(false);
				return;
			}

			const created = await res.json();
			setUsers((prev) => [
				...prev,
				{ ...created, role_name: newRole, is_active: true },
			]);
			setNewUsername('');
			setNewEmail('');
			setNewPassword('');
			setCreating(false);
		} catch {
			setError('Something went wrong.');
			setCreating(false);
		}
	}

	async function toggleEnabled(user: AdminUser) {
		setError(null);
		try {
			const res = await fetch(`/api/users/${user.id}/enabled`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_active: !user.is_active }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to update user');
				return;
			}

			setUsers((prev) =>
				prev.map((u) =>
					u.id === user.id ? { ...u, is_active: !u.is_active } : u,
				),
			);
		} catch {
			setError('Something went wrong.');
		}
	}

	async function handleDelete(user: AdminUser) {
		if (!confirm(`Delete ${user.username}? This can't be undone.`)) return;
		setError(null);

		try {
			const res = await fetch(`/api/users/${user.id}`, {
				method: 'DELETE',
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.detail || 'Failed to delete user');
				return;
			}
			setUsers((prev) => prev.filter((u) => u.id !== user.id));
		} catch {
			setError('Something went wrong.');
		}
	}

	return (
		<div className='mx-auto max-w-2xl p-6'>
			<h1 className='mb-6 text-2xl font-semibold'>Manage Users</h1>

			{error && <p className='mb-4 text-sm text-red-600'>{error}</p>}

			<form
				onSubmit={handleCreate}
				className='mb-8 space-y-3 rounded border p-4'
			>
				<h2 className='text-lg font-medium'>Add user</h2>
				<input
					value={newUsername}
					onChange={(e) => setNewUsername(e.target.value)}
					placeholder='Username'
					required
					className='w-full rounded border px-3 py-2'
				/>
				<input
					type='email'
					value={newEmail}
					onChange={(e) => setNewEmail(e.target.value)}
					placeholder='Email'
					required
					className='w-full rounded border px-3 py-2'
				/>
				<input
					type='password'
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					placeholder='Password'
					required
					className='w-full rounded border px-3 py-2'
				/>
				<select
					value={newRole}
					onChange={(e) => setNewRole(e.target.value)}
					className='w-full rounded border px-3 py-2'
				>
					<option value='user'>User</option>
					<option value='admin'>Admin</option>
				</select>
				<button
					type='submit'
					disabled={creating}
					className='w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
				>
					{creating ? 'Creating...' : 'Create user'}
				</button>
			</form>

			<ul className='space-y-2'>
				{users.map((user) => (
					<li
						key={user.id}
						className='flex items-center justify-between rounded border p-3'
					>
						<div>
							<p className='font-medium'>{user.username}</p>
							<p className='text-sm text-gray-400'>
								{user.email} · {user.role_name} ·{' '}
								{user.is_active ? 'active' : 'disabled'}
							</p>
						</div>
						<div className='flex gap-2'>
							<button
								onClick={() => toggleEnabled(user)}
								className='rounded border px-3 py-1.5 text-sm'
							>
								{user.is_active ? 'Disable' : 'Enable'}
							</button>
							<button
								onClick={() => handleDelete(user)}
								className='rounded border border-red-600 px-3 py-1.5 text-sm text-red-600'
							>
								Delete
							</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
