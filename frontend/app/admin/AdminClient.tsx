'use client';

import { useState, useEffect } from 'react';
import { AdminUser, AppSettings, Preset, BarcodeType } from '@/lib/types';
import ConfirmModal from '@/components/ConfirmModal';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
	initialUsers: AdminUser[];
	initialSettings: AppSettings;
	initialPresets: Preset[];
	initialBarcodeTypes: BarcodeType[];
}

type LengthMode = 'any' | 'fixed' | 'range';

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

	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [loadingAction, setLoadingAction] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [passwordModalUser, setPasswordModalUser] =
		useState<AdminUser | null>(null);
	const [newPassword, setNewPassword] = useState('');

	const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
	const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);
	const [barcodeTypeToDelete, setBarcodeTypeToDelete] =
		useState<BarcodeType | null>(null);

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

	const [showAddBarcodeModal, setShowAddBarcodeModal] = useState(false);
	const [newBarcodeCode, setNewBarcodeCode] = useState('');
	const [newBarcodeNumericOnly, setNewBarcodeNumericOnly] = useState(false);
	const [newBarcodeLengthMode, setNewBarcodeLengthMode] =
		useState<LengthMode>('any');
	const [newBarcodeFixedLength, setNewBarcodeFixedLength] = useState('');
	const [newBarcodeMinLength, setNewBarcodeMinLength] = useState('');
	const [newBarcodeMaxLength, setNewBarcodeMaxLength] = useState('');

	const [editingBarcodeType, setEditingBarcodeType] =
		useState<BarcodeType | null>(null);
	const [editBarcodeCode, setEditBarcodeCode] = useState('');
	const [editBarcodeNumericOnly, setEditBarcodeNumericOnly] = useState(false);
	const [editBarcodeLengthMode, setEditBarcodeLengthMode] =
		useState<LengthMode>('any');
	const [editBarcodeFixedLength, setEditBarcodeFixedLength] = useState('');
	const [editBarcodeMinLength, setEditBarcodeMinLength] = useState('');
	const [editBarcodeMaxLength, setEditBarcodeMaxLength] = useState('');

	const { t } = useTranslation();

	useEffect(() => {
		fetch('/api/me')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.id) {
					setCurrentUserId(data.id);
				}
			})
			.catch(() => {});
	}, []);

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

	function openEditBarcodeModal(bt: BarcodeType) {
		setEditingBarcodeType(bt);
		setEditBarcodeCode(bt.code);
		setEditBarcodeNumericOnly(Boolean(bt.numeric_only));

		if (bt.fixed_length !== null && bt.fixed_length !== undefined) {
			setEditBarcodeLengthMode('fixed');
			setEditBarcodeFixedLength(String(bt.fixed_length));
			setEditBarcodeMinLength('');
			setEditBarcodeMaxLength('');
		} else if (
			(bt.min_length !== null && bt.min_length !== undefined) ||
			(bt.max_length !== null && bt.max_length !== undefined)
		) {
			setEditBarcodeLengthMode('range');
			setEditBarcodeFixedLength('');
			setEditBarcodeMinLength(
				bt.min_length !== null && bt.min_length !== undefined
					? String(bt.min_length)
					: '',
			);
			setEditBarcodeMaxLength(
				bt.max_length !== null && bt.max_length !== undefined
					? String(bt.max_length)
					: '',
			);
		} else {
			setEditBarcodeLengthMode('any');
			setEditBarcodeFixedLength('');
			setEditBarcodeMinLength('');
			setEditBarcodeMaxLength('');
		}
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
				showNotice('success', t('admin.settings.updated_notice'));
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.settings.update_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
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
					nextStatus
						? t('admin.users.enabled_notice', {
								name: user.username,
							})
						: t('admin.users.disabled_notice', {
								name: user.username,
							}),
				);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.users.status_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleConfirmDeleteUser() {
		if (!userToDelete) return;
		const user = userToDelete;
		setLoadingAction(`user-delete-${user.id}`);
		try {
			const res = await fetch(`/api/users/${user.id}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				setUsers((prev) => prev.filter((u) => u.id !== user.id));
				showNotice(
					'success',
					t('admin.users.deleted_notice', { name: user.username }),
				);
				setUserToDelete(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.users.delete_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
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
					t('admin.reset_modal.success_notice', {
						name: passwordModalUser.username,
					}),
				);
				setPasswordModalUser(null);
				setNewPassword('');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.reset_modal.error_notice'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
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
				showNotice(
					'success',
					t('admin.presets.created_notice', {
						name: createdPreset.name,
					}),
				);
				setShowAddPresetModal(false);
				setNewPresetName('');
				setNewPresetImageUrl('');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.presets.create_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
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
				showNotice(
					'success',
					t('admin.presets.updated_notice', {
						name: updatedPreset.name,
					}),
				);
				setEditingPreset(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.presets.update_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleConfirmDeletePreset() {
		if (!presetToDelete) return;
		const id = presetToDelete.id;
		setLoadingAction(`preset-${id}`);
		try {
			const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
			if (res.ok) {
				setPresets((prev) => prev.filter((p) => p.id !== id));
				showNotice('success', t('admin.presets.deleted_notice'));
				setPresetToDelete(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.presets.delete_in_use_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleCreateBarcodeType(e: React.FormEvent) {
		e.preventDefault();
		if (!newBarcodeCode) return;

		setLoadingAction('create-barcode');
		try {
			const fixedLen =
				newBarcodeLengthMode === 'fixed' && newBarcodeFixedLength
					? Number(newBarcodeFixedLength)
					: null;
			const minLen =
				newBarcodeLengthMode === 'range' && newBarcodeMinLength
					? Number(newBarcodeMinLength)
					: null;
			const maxLen =
				newBarcodeLengthMode === 'range' && newBarcodeMaxLength
					? Number(newBarcodeMaxLength)
					: null;

			const res = await fetch('/api/barcode-types', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: newBarcodeCode.trim().toUpperCase(),
					numeric_only: newBarcodeNumericOnly,
					fixed_length: fixedLen,
					min_length: minLen,
					max_length: maxLen,
				}),
			});

			if (res.ok) {
				const created: BarcodeType = await res.json();
				setBarcodeTypes((prev) =>
					[...prev, created].sort((a, b) =>
						a.code.localeCompare(b.code),
					),
				);
				showNotice(
					'success',
					t('admin.presets.created_barcode_notice', {
						code: created.code,
					}),
				);
				setShowAddBarcodeModal(false);
				setNewBarcodeCode('');
				setNewBarcodeNumericOnly(false);
				setNewBarcodeLengthMode('any');
				setNewBarcodeFixedLength('');
				setNewBarcodeMinLength('');
				setNewBarcodeMaxLength('');
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.presets.create_barcode_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleUpdateBarcodeType(e: React.FormEvent) {
		e.preventDefault();
		if (!editingBarcodeType || !editBarcodeCode) return;

		setLoadingAction('update-barcode');
		try {
			const fixedLen =
				editBarcodeLengthMode === 'fixed' && editBarcodeFixedLength
					? Number(editBarcodeFixedLength)
					: null;
			const minLen =
				editBarcodeLengthMode === 'range' && editBarcodeMinLength
					? Number(editBarcodeMinLength)
					: null;
			const maxLen =
				editBarcodeLengthMode === 'range' && editBarcodeMaxLength
					? Number(editBarcodeMaxLength)
					: null;

			const res = await fetch(
				`/api/barcode-types/${editingBarcodeType.id}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						code: editBarcodeCode.trim().toUpperCase(),
						numeric_only: editBarcodeNumericOnly,
						fixed_length: fixedLen,
						min_length: minLen,
						max_length: maxLen,
					}),
				},
			);

			if (res.ok) {
				const updated: BarcodeType = await res.json();
				setBarcodeTypes((prev) =>
					prev
						.map((bt) => (bt.id === updated.id ? updated : bt))
						.sort((a, b) => a.code.localeCompare(b.code)),
				);
				showNotice(
					'success',
					t('admin.presets.updated_barcode_notice', {
						code: updated.code,
					}),
				);
				setEditingBarcodeType(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail || t('admin.presets.update_barcode_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
		} finally {
			setLoadingAction(null);
		}
	}

	async function handleConfirmDeleteBarcodeType() {
		if (!barcodeTypeToDelete) return;
		const id = barcodeTypeToDelete.id;
		setLoadingAction(`barcode-${id}`);
		try {
			const res = await fetch(`/api/barcode-types/${id}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				setBarcodeTypes((prev) => prev.filter((bt) => bt.id !== id));
				showNotice(
					'success',
					t('admin.presets.deleted_barcode_notice'),
				);
				setBarcodeTypeToDelete(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail ||
						t('admin.presets.delete_barcode_in_use_error'),
				);
			}
		} catch {
			showNotice('error', t('common.network_error'));
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
						{t('admin.title')}
					</h1>
					<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400'>
						{t('admin.subtitle')}
					</p>
				</div>
			</div>

			{error && (
				<div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 animate-fade-in'>
					{error}
				</div>
			)}
			{success && (
				<div className='rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400 animate-fade-in'>
					{success}
				</div>
			)}

			<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						{t('admin.stats.total_users')}
					</p>
					<p className='mt-1 text-2xl font-bold'>{users.length}</p>
				</div>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						{t('admin.stats.active_users')}
					</p>
					<p className='mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
						{activeUsersCount}
					</p>
				</div>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						{t('admin.stats.store_presets')}
					</p>
					<p className='mt-1 text-2xl font-bold'>{presets.length}</p>
				</div>
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
						{t('admin.stats.barcode_types')}
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
					{t('admin.tabs.user_mgmt', { count: users.length })}
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
					{t('admin.tabs.system_settings')}
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
					{t('admin.tabs.presets_barcodes')}
				</button>
			</div>

			{activeTab === 'users' && (
				<div className='space-y-4 animate-fade-in'>
					<div className='flex items-center justify-between gap-4'>
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={t('admin.users.search_placeholder')}
							className='w-full max-w-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div className='overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm'>
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-sm'>
								<thead className='border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/50 text-xs font-semibold uppercase text-zinc-500'>
									<tr>
										<th className='px-4 py-3'>
											{t('admin.users.table_user')}
										</th>
										<th className='px-4 py-3'>
											{t('admin.users.table_role')}
										</th>
										<th className='px-4 py-3'>
											{t('admin.users.table_status')}
										</th>
										<th className='px-4 py-3 text-right'>
											{t('admin.users.table_actions')}
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
												{t('admin.users.no_users')}
											</td>
										</tr>
									) : (
										filteredUsers.map((user) => {
											const isSelf =
												currentUserId !== null &&
												user.id === currentUserId;
											const isOwner =
												user.role_name === 'owner';
											const canToggleStatus =
												!isSelf && !isOwner;

											return (
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
														<span
															className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
																user.is_active
																	? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
																	: 'bg-red-500/10 text-red-600 dark:text-red-400'
															}`}
														>
															<span
																className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
															/>
															{user.is_active
																? t(
																		'admin.users.status_active',
																	)
																: t(
																		'admin.users.status_disabled',
																	)}
														</span>
													</td>
													<td className='px-4 py-3 text-right'>
														<div className='flex items-center justify-end gap-2'>
															{canToggleStatus && (
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
																	className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition active:scale-95 disabled:opacity-50 ${
																		user.is_active
																			? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
																			: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
																	}`}
																>
																	{user.is_active
																		? t(
																				'admin.users.btn_disable',
																			)
																		: t(
																				'admin.users.btn_enable',
																			)}
																</button>
															)}
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
																{t(
																	'admin.users.reset_pass',
																)}
															</button>
															{!isOwner &&
																!isSelf && (
																	<button
																		type='button'
																		disabled={
																			loadingAction ===
																			`user-delete-${user.id}`
																		}
																		onClick={() =>
																			setUserToDelete(
																				user,
																			)
																		}
																		className='rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition'
																	>
																		{t(
																			'common.delete',
																		)}
																	</button>
																)}
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{activeTab === 'settings' && (
				<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-6 shadow-sm animate-fade-in'>
					<div>
						<h2 className='text-lg font-bold'>
							{t('admin.settings.title')}
						</h2>
						<p className='text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1'>
							{t('admin.settings.desc')}
						</p>
					</div>

					<div className='flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800'>
						<div>
							<p className='font-semibold text-sm'>
								{t('admin.settings.allow_label')}
							</p>
							<p className='text-xs text-zinc-500 mt-0.5'>
								{settings.registration_enabled
									? t('admin.settings.open_info')
									: t('admin.settings.closed_info')}
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
				<div className='space-y-6 animate-fade-in'>
					{/* Presets Block */}
					<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
						<div className='flex items-center justify-between mb-4'>
							<h2 className='text-lg font-bold'>
								{t('admin.presets.title', {
									count: presets.length,
								})}
							</h2>
							<button
								type='button'
								onClick={() => setShowAddPresetModal(true)}
								className='rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition'
							>
								{t('admin.presets.add_btn')}
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
												t(
													'admin.presets.no_default_color',
												)}
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
											{t('common.edit')}
										</button>
										<button
											type='button'
											disabled={
												loadingAction ===
												`preset-${preset.id}`
											}
											onClick={() =>
												setPresetToDelete(preset)
											}
											className='text-xs text-red-500 hover:underline p-1 disabled:opacity-50'
										>
											{t('common.delete')}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Barcode Standards Block */}
					<div className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm'>
						<div className='flex items-center justify-between mb-4'>
							<h2 className='text-lg font-bold'>
								{t('admin.presets.standards_title', {
									count: barcodeTypes.length,
								})}
							</h2>
							<button
								type='button'
								onClick={() => setShowAddBarcodeModal(true)}
								className='rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition'
							>
								{t('admin.presets.add_barcode_btn')}
							</button>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
							{barcodeTypes.map((bt) => (
								<div
									key={bt.id}
									className='flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-3 shadow-xs'
								>
									<div className='truncate mr-2'>
										<p className='font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100'>
											{bt.code}
										</p>
										<p className='text-[11px] text-zinc-400 mt-0.5'>
											{bt.numeric_only
												? t(
														'admin.presets.numeric_only',
													)
												: t(
														'admin.presets.alphanumeric',
													)}
											{bt.fixed_length !== null &&
											bt.fixed_length !== undefined
												? ` • ${t('admin.presets.fixed_len', { len: bt.fixed_length })}`
												: bt.min_length || bt.max_length
													? ` • ${t('admin.presets.min_max_len', { min: bt.min_length ?? '?', max: bt.max_length ?? '?' })}`
													: ''}
										</p>
									</div>
									<div className='flex items-center gap-1 shrink-0'>
										<button
											type='button'
											onClick={() =>
												openEditBarcodeModal(bt)
											}
											className='text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
										>
											{t('common.edit')}
										</button>
										<button
											type='button'
											disabled={
												loadingAction ===
												`barcode-${bt.id}`
											}
											onClick={() =>
												setBarcodeTypeToDelete(bt)
											}
											className='text-xs text-red-500 hover:underline p-1 disabled:opacity-50'
										>
											{t('common.delete')}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* ADD PRESET MODAL */}
			{showAddPresetModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
					<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
						<h3 className='text-lg font-bold'>
							{t('admin.presets.add_modal_title')}
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							{t('admin.presets.add_modal_desc')}
						</p>

						<form
							onSubmit={handleCreatePreset}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.name_label')}
								</label>
								<input
									type='text'
									required
									value={newPresetName}
									onChange={(e) =>
										setNewPresetName(e.target.value)
									}
									placeholder={t(
										'admin.presets.name_placeholder',
									)}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.barcode_standard_label')}
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
												? `(${t('common.numeric')})`
												: `(${t('common.alphanumeric')})`}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.default_color_label')}
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
									{t(
										'admin.presets.image_url_label_optional',
									)}
								</label>
								<input
									type='text'
									value={newPresetImageUrl}
									onChange={(e) =>
										setNewPresetImageUrl(e.target.value)
									}
									placeholder={t(
										'admin.presets.image_url_placeholder',
									)}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setShowAddPresetModal(false)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									{t('common.cancel')}
								</button>
								<button
									type='submit'
									disabled={loadingAction === 'create-preset'}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'create-preset'
										? t('admin.presets.creating_btn')
										: t('admin.presets.create_btn')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* EDIT PRESET MODAL */}
			{editingPreset && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
					<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
						<h3 className='text-lg font-bold'>
							{t('admin.presets.edit_modal_title')}
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							{t('admin.presets.edit_modal_desc', {
								name: editingPreset.name,
							})}
						</p>

						<form
							onSubmit={handleUpdatePreset}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.name_label')}
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
									{t('admin.presets.barcode_standard_label')}
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
												? `(${t('common.numeric')})`
												: `(${t('common.alphanumeric')})`}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.default_color_label')}
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
									{t('admin.presets.image_url_label')}
								</label>
								<input
									type='text'
									value={editPresetImageUrl}
									onChange={(e) =>
										setEditPresetImageUrl(e.target.value)
									}
									placeholder={t(
										'admin.presets.image_url_placeholder',
									)}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setEditingPreset(null)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									{t('common.cancel')}
								</button>
								<button
									type='submit'
									disabled={loadingAction === 'update-preset'}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'update-preset'
										? t('common.saving')
										: t('common.save_changes')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ADD BARCODE TYPE MODAL */}
			{showAddBarcodeModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
					<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
						<h3 className='text-lg font-bold'>
							{t('admin.presets.add_barcode_modal_title')}
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							{t('admin.presets.add_barcode_modal_desc')}
						</p>

						<form
							onSubmit={handleCreateBarcodeType}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.barcode_code_label')}
								</label>
								<input
									type='text'
									required
									value={newBarcodeCode}
									onChange={(e) =>
										setNewBarcodeCode(e.target.value)
									}
									placeholder={t(
										'admin.presets.barcode_code_placeholder',
									)}
									className='w-full uppercase font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<label className='flex items-center gap-2 cursor-pointer pt-1'>
								<input
									type='checkbox'
									checked={newBarcodeNumericOnly}
									onChange={(e) =>
										setNewBarcodeNumericOnly(
											e.target.checked,
										)
									}
									className='h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-xs font-medium text-zinc-700 dark:text-zinc-300'>
									{t('admin.presets.numeric_only_label')}
								</span>
							</label>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5'>
									{t('admin.presets.length_mode_label')}
								</label>
								<div className='grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 p-1 bg-zinc-100/60 dark:bg-zinc-800/60 text-xs font-medium'>
									{(
										[
											'any',
											'fixed',
											'range',
										] as LengthMode[]
									).map((mode) => (
										<button
											key={mode}
											type='button'
											onClick={() => {
												setNewBarcodeLengthMode(mode);
												if (mode === 'any') {
													setNewBarcodeFixedLength(
														'',
													);
													setNewBarcodeMinLength('');
													setNewBarcodeMaxLength('');
												} else if (mode === 'fixed') {
													setNewBarcodeMinLength('');
													setNewBarcodeMaxLength('');
												} else {
													setNewBarcodeFixedLength(
														'',
													);
												}
											}}
											className={`py-1.5 px-2 rounded-lg text-center transition-all ${
												newBarcodeLengthMode === mode
													? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
													: 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
											}`}
										>
											{t(
												`admin.presets.length_mode_${mode}`,
											)}
										</button>
									))}
								</div>
							</div>

							{newBarcodeLengthMode === 'fixed' && (
								<div className='animate-fade-in'>
									<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
										{t('admin.presets.fixed_length_label')}
									</label>
									<input
										type='number'
										min={1}
										value={newBarcodeFixedLength}
										onChange={(e) =>
											setNewBarcodeFixedLength(
												e.target.value,
											)
										}
										placeholder='e.g. 13'
										className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
									/>
								</div>
							)}

							{newBarcodeLengthMode === 'range' && (
								<div className='grid grid-cols-2 gap-2 animate-fade-in'>
									<div>
										<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
											{t(
												'admin.presets.min_length_label',
											)}
										</label>
										<input
											type='number'
											min={1}
											value={newBarcodeMinLength}
											onChange={(e) =>
												setNewBarcodeMinLength(
													e.target.value,
												)
											}
											placeholder='e.g. 8'
											className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
									<div>
										<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
											{t(
												'admin.presets.max_length_label',
											)}
										</label>
										<input
											type='number'
											min={1}
											value={newBarcodeMaxLength}
											onChange={(e) =>
												setNewBarcodeMaxLength(
													e.target.value,
												)
											}
											placeholder='e.g. 18'
											className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
								</div>
							)}

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() =>
										setShowAddBarcodeModal(false)
									}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									{t('common.cancel')}
								</button>
								<button
									type='submit'
									disabled={
										loadingAction === 'create-barcode'
									}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'create-barcode'
										? t('admin.presets.creating_btn')
										: t('admin.presets.create_barcode_btn')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* EDIT BARCODE TYPE MODAL */}
			{editingBarcodeType && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
					<div className='w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
						<h3 className='text-lg font-bold'>
							{t('admin.presets.edit_barcode_modal_title')}
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							{t('admin.presets.edit_barcode_modal_desc', {
								code: editingBarcodeType.code,
							})}
						</p>

						<form
							onSubmit={handleUpdateBarcodeType}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.presets.barcode_code_label')}
								</label>
								<input
									type='text'
									required
									value={editBarcodeCode}
									onChange={(e) =>
										setEditBarcodeCode(e.target.value)
									}
									className='w-full uppercase font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<label className='flex items-center gap-2 cursor-pointer pt-1'>
								<input
									type='checkbox'
									checked={editBarcodeNumericOnly}
									onChange={(e) =>
										setEditBarcodeNumericOnly(
											e.target.checked,
										)
									}
									className='h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-xs font-medium text-zinc-700 dark:text-zinc-300'>
									{t('admin.presets.numeric_only_label')}
								</span>
							</label>

							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5'>
									{t('admin.presets.length_mode_label')}
								</label>
								<div className='grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 p-1 bg-zinc-100/60 dark:bg-zinc-800/60 text-xs font-medium'>
									{(
										[
											'any',
											'fixed',
											'range',
										] as LengthMode[]
									).map((mode) => (
										<button
											key={mode}
											type='button'
											onClick={() => {
												setEditBarcodeLengthMode(mode);
												if (mode === 'any') {
													setEditBarcodeFixedLength(
														'',
													);
													setEditBarcodeMinLength('');
													setEditBarcodeMaxLength('');
												} else if (mode === 'fixed') {
													setEditBarcodeMinLength('');
													setEditBarcodeMaxLength('');
												} else {
													setEditBarcodeFixedLength(
														'',
													);
												}
											}}
											className={`py-1.5 px-2 rounded-lg text-center transition-all ${
												editBarcodeLengthMode === mode
													? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
													: 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
											}`}
										>
											{t(
												`admin.presets.length_mode_${mode}`,
											)}
										</button>
									))}
								</div>
							</div>

							{editBarcodeLengthMode === 'fixed' && (
								<div className='animate-fade-in'>
									<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
										{t('admin.presets.fixed_length_label')}
									</label>
									<input
										type='number'
										min={1}
										value={editBarcodeFixedLength}
										onChange={(e) =>
											setEditBarcodeFixedLength(
												e.target.value,
											)
										}
										placeholder='e.g. 13'
										className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
									/>
								</div>
							)}

							{editBarcodeLengthMode === 'range' && (
								<div className='grid grid-cols-2 gap-2 animate-fade-in'>
									<div>
										<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
											{t(
												'admin.presets.min_length_label',
											)}
										</label>
										<input
											type='number'
											min={1}
											value={editBarcodeMinLength}
											onChange={(e) =>
												setEditBarcodeMinLength(
													e.target.value,
												)
											}
											placeholder='e.g. 8'
											className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
									<div>
										<label className='block text-[11px] font-semibold uppercase text-zinc-500 mb-1'>
											{t(
												'admin.presets.max_length_label',
											)}
										</label>
										<input
											type='number'
											min={1}
											value={editBarcodeMaxLength}
											onChange={(e) =>
												setEditBarcodeMaxLength(
													e.target.value,
												)
											}
											placeholder='e.g. 18'
											className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
								</div>
							)}

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setEditingBarcodeType(null)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									{t('common.cancel')}
								</button>
								<button
									type='submit'
									disabled={
										loadingAction === 'update-barcode'
									}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'update-barcode'
										? t('common.saving')
										: t('common.save_changes')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* RESET PASSWORD MODAL */}
			{passwordModalUser && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in'>
					<div className='w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-scale-in'>
						<h3 className='text-lg font-bold'>
							{t('admin.reset_modal.title')}
						</h3>
						<p className='text-xs text-zinc-500 mt-1'>
							{t('admin.reset_modal.desc', {
								name: passwordModalUser.username,
							})}
						</p>

						<form
							onSubmit={handleResetPassword}
							className='mt-4 space-y-4'
						>
							<div>
								<label className='block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1'>
									{t('admin.reset_modal.password_label')}
								</label>
								<input
									type='password'
									required
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									placeholder={t(
										'admin.reset_modal.password_placeholder',
									)}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									onClick={() => setPasswordModalUser(null)}
									className='rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
								>
									{t('common.cancel')}
								</button>
								<button
									type='submit'
									disabled={
										loadingAction === 'password-reset'
									}
									className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition'
								>
									{loadingAction === 'password-reset'
										? t('admin.reset_modal.submitting_btn')
										: t('admin.reset_modal.submit_btn')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<ConfirmModal
				isOpen={Boolean(userToDelete)}
				title={t('common.delete')}
				message={
					userToDelete
						? t('admin.users.delete_confirm', {
								name: userToDelete.username,
							})
						: ''
				}
				confirmText={t('common.delete')}
				isDestructive={true}
				isLoading={loadingAction === `user-delete-${userToDelete?.id}`}
				onConfirm={handleConfirmDeleteUser}
				onCancel={() => setUserToDelete(null)}
			/>

			<ConfirmModal
				isOpen={Boolean(presetToDelete)}
				title={t('common.delete')}
				message={t('admin.presets.delete_confirm')}
				confirmText={t('common.delete')}
				isDestructive={true}
				isLoading={loadingAction === `preset-${presetToDelete?.id}`}
				onConfirm={handleConfirmDeletePreset}
				onCancel={() => setPresetToDelete(null)}
			/>

			<ConfirmModal
				isOpen={Boolean(barcodeTypeToDelete)}
				title={t('common.delete')}
				message={t('admin.presets.delete_barcode_confirm')}
				confirmText={t('common.delete')}
				isDestructive={true}
				isLoading={
					loadingAction === `barcode-${barcodeTypeToDelete?.id}`
				}
				onConfirm={handleConfirmDeleteBarcodeType}
				onCancel={() => setBarcodeTypeToDelete(null)}
			/>
		</div>
	);
}
