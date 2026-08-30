'use client';

import { useState } from 'react';
import { AdminUser, AppSettings, Preset, BarcodeType } from '@/lib/types';

interface Props {
	initialUsers: AdminUser[];
	initialSettings: AppSettings;
	initialPresets: Preset[];
	initialBarcodeTypes: BarcodeType[];
}

export default function AdminClient({
	initialUsers,
	initialSettings,
	initialPresets,
	initialBarcodeTypes,
}: Props) {
	const [activeTab, setActiveTab] = useState<
		'users' | 'settings' | 'presets'
	>('users');
	const [users, setUsers] = useState<AdminUser[]>(initialUsers);
	const [settings, setSettings] = useState<AppSettings>(initialSettings);
	const [presets, setPresets] = useState<Preset[]>(initialPresets);
	const [barcodeTypes, setBarcodeTypes] =
		useState<BarcodeType[]>(initialBarcodeTypes);

	const [searchQuery, setSearchQuery] = useState('');
	const [loadingAction, setLoadingAction] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [passwordModalUser, setPasswordModalUser] =
		useState<AdminUser | null>(null);
	const [newPassword, setNewPassword] = useState('');

	const [showAddPresetModal, setShowAddPresetModal] = useState(false);
	const [newPresetName, setNewPresetName] = useState('');
	const [newPresetBarcodeTypeId, setNewPresetBarcodeTypeId] =
		useState<string>(initialBarcodeTypes[0]?.id?.toString() || '');
	const [newPresetColor, setNewPresetColor] = useState('#2563eb');
	const [newPresetImageUrl, setNewPresetImageUrl] = useState('');

	const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
	const [editPresetName, setEditPresetName] = useState('');
	const [editPresetBarcodeTypeId, setEditPresetBarcodeTypeId] =
		useState<string>('');
	const [editPresetColor, setEditPresetColor] = useState('#2563eb');
	const [editPresetImageUrl, setEditPresetImageUrl] = useState('');

	function showNotice(type: 'error' | 'success', msg: string) {
		if (type === 'error') {
			setError(msg);
			setTimeout(() => setError(null), 4000);
		} else {
			setSuccess(msg);
			setTimeout(() => setSuccess(null), 4000);
		}
	}

	function openEditPresetModal(preset: Preset) {
		setEditingPreset(preset);
		setEditPresetName(preset.name);
		setEditPresetBarcodeTypeId(preset.barcode_type_id.toString());
		setEditPresetColor(preset.color_scheme || '#2563eb');
		setEditPresetImageUrl(preset.image_url || '');
	}

	async function handleToggleRegistration() {
		setLoadingAction('settings');
		try {
			const res = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					registration_enabled: !settings.registration_enabled,
				}),
			});
			if (res.ok) {
				const updated = await res.json();
				setSettings(updated);
				showNotice('success', 'Registration setting updated');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice('error', err.detail || 'Failed to update setting');
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleToggleUserStatus(user: AdminUser) {
		const nextStatus = !user.is_active;
		setLoadingAction(`user-status-${user.id}`);
		try {
			const res = await fetch(
				`/api/users/${user.id}/enabled?is_active=${nextStatus}`,
				{
					method: 'PATCH',
				},
			);
			if (res.ok) {
				setUsers((prev) =>
					prev.map((u) =>
						u.id === user.id ? { ...u, is_active: nextStatus } : u,
					),
				);
				showNotice(
					'success',
					`User ${user.username} ${nextStatus ? 'enabled' : 'disabled'}`,
				);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || 'Failed to update user status',
				);
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleDeleteUser(user: AdminUser) {
		if (
			!confirm(
				`Are you sure you want to permanently delete user "${user.username}"?`,
			)
		)
			return;
		setLoadingAction(`user-delete-${user.id}`);
		try {
			const res = await fetch(`/api/users/${user.id}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				setUsers((prev) => prev.filter((u) => u.id !== user.id));
				showNotice('success', `User ${user.username} deleted`);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice('error', err.detail || 'Failed to delete user');
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleResetPassword(e: React.FormEvent) {
		e.preventDefault();
		if (!passwordModalUser || !newPassword) return;

		setLoadingAction('password-reset');
		try {
			const res = await fetch(
				`/api/users/${passwordModalUser.id}/reset-password`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ new_password: newPassword }),
				},
			);
			if (res.ok) {
				showNotice(
					'success',
					`Password updated for ${passwordModalUser.username}`,
				);
				setPasswordModalUser(null);
				setNewPassword('');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice('error', err.detail || 'Failed to reset password');
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleCreatePreset(e: React.FormEvent) {
		e.preventDefault();
		if (!newPresetName || !newPresetBarcodeTypeId) return;

		setLoadingAction('create-preset');
		try {
			const res = await fetch('/api/presets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newPresetName,
					barcode_type_id: Number(newPresetBarcodeTypeId),
					color_scheme: newPresetColor || null,
					image_url: newPresetImageUrl || '',
				}),
			});

			if (res.ok) {
				const createdPreset: Preset = await res.json();
				setPresets((prev) =>
					[...prev, createdPreset].sort((a, b) =>
						a.name.localeCompare(b.name),
					),
				);
				showNotice('success', `Preset "${createdPreset.name}" created`);
				setShowAddPresetModal(false);
				setNewPresetName('');
				setNewPresetImageUrl('');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice('error', err.detail || 'Failed to create preset');
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleUpdatePreset(e: React.FormEvent) {
		e.preventDefault();
		if (!editingPreset || !editPresetName || !editPresetBarcodeTypeId)
			return;

		setLoadingAction('update-preset');
		try {
			const res = await fetch(`/api/presets/${editingPreset.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editPresetName,
					barcode_type_id: Number(editPresetBarcodeTypeId),
					color_scheme: editPresetColor || null,
					image_url: editPresetImageUrl || '',
				}),
			});

			if (res.ok) {
				const updatedPreset: Preset = await res.json();
				setPresets((prev) =>
					prev
						.map((p) =>
							p.id === updatedPreset.id ? updatedPreset : p,
						)
						.sort((a, b) => a.name.localeCompare(b.name)),
				);
				showNotice('success', `Preset "${updatedPreset.name}" updated`);
				setEditingPreset(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice('error', err.detail || 'Failed to update preset');
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleDeletePreset(id: number) {
		if (
			!confirm(
				'Delete this preset? Cards referencing it will block deletion.',
			)
		)
			return;
		setLoadingAction(`preset-${id}`);
		try {
			const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
			if (res.ok) {
				setPresets((prev) => prev.filter((p) => p.id !== id));
				showNotice('success', 'Preset deleted');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || 'Cannot delete preset in use',
				);
			}
		} catch {
			showNotice('error', 'Network error occurred');
		} finally {
			setLoadingAction(null);
		}
	}

	const filteredUsers = users.filter(
		(u) =>
			u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.email.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const activeUsersCount = users.filter((u) => u.is_active).length;

	return (
		<div className='mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
						Admin Dashboard
					</h1>
					<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400'>
						Manage registered accounts, platform presets, and system
						parameters.
					</p>
				</div>
			</div>

			{error && (
				<div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400'>
					{error}
				</div>
			)}
			{success && (
				<div className='rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400'>
					{success}
				</div>
			)}

			<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						Total Users
					</p>
					<p className='mt-1 text-2xl font-bold'>{users.length}</p>
				</div>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						Active Users
					</p>
					<p className='mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
						{activeUsersCount}
					</p>
				</div>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						Store Presets
					</p>
					<p className='mt-1 text-2xl font-bold'>{presets.length}</p>
				</div>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						Barcode Types
					</p>
					<p className='mt-1 text-2xl font-bold'>
						{barcodeTypes.length}
					</p>
				</div>
			</div>

			<div className='flex border-b border-zinc-200 dark:border-zinc-800 gap-4 text-sm font-medium'>
				<button
					type='button'
					onClick={() => setActiveTab('users')}
					className={`pb-2.5 transition border-b-2 ${
						activeTab === 'users'
							? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
							: 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
					}`}
				>
					User Management ({users.length})
				</button>
				<button
					type='button'
					onClick={() => setActiveTab('settings')}
					className={`pb-2.5 transition border-b-2 ${
						activeTab === 'settings'
							? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
							: 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
					}`}
				>
					System Settings
				</button>
				<button
					type='button'
					onClick={() => setActiveTab('presets')}
					className={`pb-2.5 transition border-b-2 ${
						activeTab === 'presets'
							? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
							: 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
					}`}
				>
					Presets & Barcodes
				</button>
			</div>

			{activeTab === 'users' && (
				<div className='space-y-4'>
					<div className='flex items-center justify-between gap-4'>
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Search by username or email...'
							className='w-full max-w-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div className='overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm'>
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-sm'>
								<thead className='border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/50 text-xs font-semibold uppercase text-zinc-500'>
									<tr>
										<th className='px-4 py-3'>User</th>
										<th className='px-4 py-3'>Role</th>
										<th className='px-4 py-3'>Status</th>
										<th className='px-4 py-3 text-right'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
									{filteredUsers.length === 0 ? (
										<tr>
											<td
												colSpan={4}
												className='p-4 text-center text-zinc-500'
											>
												No users found.
											</td>
										</tr>
									) : (
										filteredUsers.map((user) => (
											<tr
												key={user.id}
												className='hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition'
											>
												<td className='px-4 py-3'>
													<div className='font-medium text-zinc-900 dark:text-zinc-100'>
														{user.username}
													</div>
													<div className='text-xs text-zinc-500'>
														{user.email}
													</div>
												</td>
												<td className='px-4 py-3'>
													<span
														className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
															user.role_name ===
															'owner'
																? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
																: user.role_name ===
																	  'admin'
																	? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
																	: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
														}`}
													>
														{user.role_name}
													</span>
												</td>
												<td className='px-4 py-3'>
													<button
														type='button'
														disabled={
															loadingAction ===
															`user-status-${user.id}`
														}
														onClick={() =>
															handleToggleUserStatus(
																user,
															)
														}
														className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition active:scale-95 disabled:opacity-50 ${
															user.is_active
																? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
																: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
														}`}
													>
														<span
															className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
														/>
														{user.is_active
															? 'Active'
															: 'Disabled'}
													</button>
												</td>
												<td className='px-4 py-3 text-right'>
													<div className='flex items-center justify-end gap-2'>
														<button
															type='button'
															onClick={() => {
																setPasswordModalUser(
																	user,
																);
																setNewPassword(
																	'',
																);
															}}
															className='rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
														>
															Reset Pass
														</button>
														{user.role_name !==
															'owner' && (
															<button
																type='button'
																disabled={
																	loadingAction ===
																	`user-delete-${user.id}`
																}
																onClick={() =>
																	handleDeleteUser(
																		user,
																	)
																}
																className='rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition'
															>
																Delete
															</button>
														)}
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{activeTab === 'settings' && (
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-6 shadow-sm'>
					<div>
						<h2 className='text-lg font-bold'>
							Public Registration
						</h2>
						<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1'>
							Control whether new users can create an account on
							the public register page.
						</p>
					</div>

					<div className='flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800'>
						<div>
							<p className='font-semibold text-sm'>
								Allow new user registrations
							</p>
							<p className='text-xs text-zinc-500 mt-0.5'>
								{settings.registration_enabled
									? 'Registration is open to everyone.'
									: 'Registration is closed. Only existing users or admins can access.'}
							</p>
						</div>
						<button
							type='button'
							disabled={loadingAction === 'settings'}
							onClick={handleToggleRegistration}
							className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
								settings.registration_enabled
									? 'bg-blue-600'
									: 'bg-zinc-300 dark:bg-zinc-700'
							}`}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
									settings.registration_enabled
										? 'translate-x-5'
										: 'translate-x-0'
								}`}
							/>
						</button>
					</div>
				</div>
			)}

			{activeTab === 'presets' && (
				<div className='space-y-6'>
					<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
						<div className='flex items-center justify-between mb-4'>
							<h2 className='text-lg font-bold'>
								Company Presets ({presets.length})
							</h2>
							<button
								type='button'
								onClick={() => setShowAddPresetModal(true)}
								className='rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition'
							>
								+ Add Preset
							</button>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
							{presets.map((preset) => (
								<div
									key={preset.id}
									className='flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-3 shadow-xs'
									style={{
										borderLeftWidth: preset.color_scheme
											? '4px'
											: '1px',
										borderLeftColor:
											preset.color_scheme || undefined,
									}}
								>
									<div className='truncate mr-2'>
										<p className='font-semibold text-sm truncate'>
											{preset.name}
										</p>
										<p className='text-xs text-zinc-400 font-mono mt-0.5'>
											{preset.color_scheme ||
												'No default color'}
										</p>
									</div>
									<div className='flex items-center gap-1 shrink-0'>
										<button
											type='button'
											onClick={() =>
												openEditPresetModal(preset)
											}
											className='text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
										>
											Edit
										</button>
										<button
											type='button'
											disabled={
												loadingAction ===
												`preset-${preset.id}`
											}
											onClick={() =>
												handleDeletePreset(preset.id)
											}
											className='text-xs text-red-500 hover:underline p-1 disabled:opacity-50'
										>
											Delete
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
						<h2 className='text-lg font-bold mb-4'>
							Barcode Standards ({barcodeTypes.length})
						</h2>
						<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'>
							{barcodeTypes.map((bt) => (
								<div
									key={bt.id}
									className='rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-3 text-center'
								>
									<p className='font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100'>
										{bt.code}
									</p>
									<p className='text-[11px] text-zinc-400 mt-1'>
										{bt.numeric_only
											? 'Numeric only'
											: 'Alphanumeric'}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{showAddPresetModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
					<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl'>
						<h3 className='text-lg font-bold'>
							Add Company Preset
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							Create a reusable store preset with brand defaults.
						</p>

						<form
							onSubmit={handleCreatePreset}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Preset / Store Name
								</label>
								<input
									type='text'
									required
									value={newPresetName}
									onChange={(e) =>
										setNewPresetName(e.target.value)
									}
									placeholder='e.g. Tesco, Lidl, IKEA'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Barcode Standard
								</label>
								<select
									value={newPresetBarcodeTypeId}
									onChange={(e) =>
										setNewPresetBarcodeTypeId(
											e.target.value,
										)
									}
									required
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									{barcodeTypes.map((bt) => (
										<option key={bt.id} value={bt.id}>
											{bt.code}{' '}
											{bt.numeric_only
												? '(Numeric)'
												: '(Alphanumeric)'}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Brand Default Color
								</label>
								<div className='flex gap-2 items-center'>
									<input
										type='color'
										value={newPresetColor}
										onChange={(e) =>
											setNewPresetColor(e.target.value)
										}
										className='h-10 w-10 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-1'
									/>
									<input
										value={newPresetColor}
										onChange={(e) =>
											setNewPresetColor(e.target.value)
										}
										placeholder='#2563eb'
										className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
									/>
								</div>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Logo / Image URL (optional)
								</label>
								<input
									type='text'
									value={newPresetImageUrl}
									onChange={(e) =>
										setNewPresetImageUrl(e.target.value)
									}
									placeholder='https://example.com/logo.png'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setShowAddPresetModal(false)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={loadingAction === 'create-preset'}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'create-preset'
										? 'Creating...'
										: 'Create Preset'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{editingPreset && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
					<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl'>
						<h3 className='text-lg font-bold'>
							Edit Company Preset
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							Update preset defaults for{' '}
							<span className='font-semibold text-zinc-800 dark:text-zinc-200'>
								{editingPreset.name}
							</span>
							.
						</p>

						<form
							onSubmit={handleUpdatePreset}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Preset / Store Name
								</label>
								<input
									type='text'
									required
									value={editPresetName}
									onChange={(e) =>
										setEditPresetName(e.target.value)
									}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Barcode Standard
								</label>
								<select
									value={editPresetBarcodeTypeId}
									onChange={(e) =>
										setEditPresetBarcodeTypeId(
											e.target.value,
										)
									}
									required
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									{barcodeTypes.map((bt) => (
										<option key={bt.id} value={bt.id}>
											{bt.code}{' '}
											{bt.numeric_only
												? '(Numeric)'
												: '(Alphanumeric)'}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Brand Default Color
								</label>
								<div className='flex gap-2 items-center'>
									<input
										type='color'
										value={editPresetColor}
										onChange={(e) =>
											setEditPresetColor(e.target.value)
										}
										className='h-10 w-10 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-1'
									/>
									<input
										value={editPresetColor}
										onChange={(e) =>
											setEditPresetColor(e.target.value)
										}
										placeholder='#2563eb'
										className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
									/>
								</div>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									Logo / Image URL
								</label>
								<input
									type='text'
									value={editPresetImageUrl}
									onChange={(e) =>
										setEditPresetImageUrl(e.target.value)
									}
									placeholder='https://example.com/logo.png'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setEditingPreset(null)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={loadingAction === 'update-preset'}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'update-preset'
										? 'Saving...'
										: 'Save Changes'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{passwordModalUser && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
					<div className='w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl'>
						<h3 className='text-lg font-bold'>Reset Password</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							Set a new password for{' '}
							<span className='font-semibold text-zinc-800 dark:text-zinc-200'>
								{passwordModalUser.username}
							</span>
							.
						</p>

						<form
							onSubmit={handleResetPassword}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									New Password
								</label>
								<input
									type='password'
									required
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									placeholder='Enter new password'
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setPasswordModalUser(null)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={
										loadingAction === 'password-reset'
									}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'password-reset'
										? 'Saving...'
										: 'Set Password'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
