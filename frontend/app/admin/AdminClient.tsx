'use client';

import { useState, useEffect } from 'react';
import { AdminUser, AppSettings, Preset, BarcodeType } from '@/lib/types';
import ConfirmModal from '@/components/ConfirmModal';
import UserManagementTab from '@/components/UserManagementTab';
import SystemSettingsTab from '@/components/SystemSettingsTab';
import PresetsAndBarcodesTab from '@/components/PresetsAndBarcodesTab';
import PresetModal from '@/components/PresetModal';
import BarcodeTypeModal from '@/components/BarcodeTypeModal';
import PasswordResetModal from '@/components/PasswordResetModal';
import { useTranslation } from '@/context/LanguageContext';

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

	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [loadingAction, setLoadingAction] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Modal target state
	const [passwordModalUser, setPasswordModalUser] =
		useState<AdminUser | null>(null);
	const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
	const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);
	const [barcodeTypeToDelete, setBarcodeTypeToDelete] =
		useState<BarcodeType | null>(null);

	const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
	const [presetToEdit, setPresetToEdit] = useState<Preset | null>(null);

	const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
	const [barcodeToEdit, setBarcodeToEdit] = useState<BarcodeType | null>(
		null,
	);

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

	async function handleResetPassword(password: string) {
		if (!passwordModalUser || !password) return;

		setLoadingAction('password-reset');
		try {
			const res = await fetch(
				`/api/users/${passwordModalUser.id}/reset-password`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ new_password: password }),
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

	async function handleSavePreset(data: {
		name: string;
		barcode_type_id: number;
		color_scheme: string | null;
		image_url: string;
	}) {
		const isEdit = Boolean(presetToEdit);
		setLoadingAction(isEdit ? 'update-preset' : 'create-preset');

		try {
			const url = isEdit
				? `/api/presets/${presetToEdit?.id}`
				: '/api/presets';
			const method = isEdit ? 'PATCH' : 'POST';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (res.ok) {
				const resultPreset: Preset = await res.json();
				setPresets((prev) => {
					const next = isEdit
						? prev.map((p) =>
								p.id === resultPreset.id ? resultPreset : p,
							)
						: [...prev, resultPreset];
					return next.sort((a, b) => a.name.localeCompare(b.name));
				});

				showNotice(
					'success',
					isEdit
						? t('admin.presets.updated_notice', {
								name: resultPreset.name,
							})
						: t('admin.presets.created_notice', {
								name: resultPreset.name,
							}),
				);
				setIsPresetModalOpen(false);
				setPresetToEdit(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail ||
						(isEdit
							? t('admin.presets.update_error')
							: t('admin.presets.create_error')),
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

	async function handleSaveBarcodeType(data: {
		code: string;
		numeric_only: boolean;
		fixed_length: number | null;
		min_length: number | null;
		max_length: number | null;
	}) {
		const isEdit = Boolean(barcodeToEdit);
		setLoadingAction(isEdit ? 'update-barcode' : 'create-barcode');

		try {
			const url = isEdit
				? `/api/barcode-types/${barcodeToEdit?.id}`
				: '/api/barcode-types';
			const method = isEdit ? 'PATCH' : 'POST';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (res.ok) {
				const resultBt: BarcodeType = await res.json();
				setBarcodeTypes((prev) => {
					const next = isEdit
						? prev.map((bt) =>
								bt.id === resultBt.id ? resultBt : bt,
							)
						: [...prev, resultBt];
					return next.sort((a, b) => a.code.localeCompare(b.code));
				});

				showNotice(
					'success',
					isEdit
						? t('admin.presets.updated_barcode_notice', {
								code: resultBt.code,
							})
						: t('admin.presets.created_barcode_notice', {
								code: resultBt.code,
							}),
				);
				setIsBarcodeModalOpen(false);
				setBarcodeToEdit(null);
			} else {
				const err = await res.json().catch(() => ({}));
				showNotice(
					'error',
					err.detail ||
						(isEdit
							? t('admin.presets.update_barcode_error')
							: t('admin.presets.create_barcode_error')),
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
				<UserManagementTab
					users={users}
					currentUserId={currentUserId}
					loadingAction={loadingAction}
					onToggleStatus={handleToggleUserStatus}
					onResetPassword={(u: AdminUser) => setPasswordModalUser(u)}
					onDeleteUser={(u: AdminUser) => setUserToDelete(u)}
				/>
			)}

			{activeTab === 'settings' && (
				<SystemSettingsTab
					settings={settings}
					isLoading={loadingAction === 'settings'}
					onToggleRegistration={handleToggleRegistration}
				/>
			)}

			{activeTab === 'presets' && (
				<PresetsAndBarcodesTab
					presets={presets}
					barcodeTypes={barcodeTypes}
					loadingAction={loadingAction}
					onOpenAddPreset={() => {
						setPresetToEdit(null);
						setIsPresetModalOpen(true);
					}}
					onOpenEditPreset={(p: Preset) => {
						setPresetToEdit(p);
						setIsPresetModalOpen(true);
					}}
					onDeletePreset={(p: Preset) => setPresetToDelete(p)}
					onOpenAddBarcode={() => {
						setBarcodeToEdit(null);
						setIsBarcodeModalOpen(true);
					}}
					onOpenEditBarcode={(bt: BarcodeType) => {
						setBarcodeToEdit(bt);
						setIsBarcodeModalOpen(true);
					}}
					onDeleteBarcode={(bt: BarcodeType) =>
						setBarcodeTypeToDelete(bt)
					}
				/>
			)}

			{/* PRESET MODAL */}
			{isPresetModalOpen && (
				<PresetModal
					preset={presetToEdit}
					barcodeTypes={barcodeTypes}
					isLoading={
						loadingAction === 'create-preset' ||
						loadingAction === 'update-preset'
					}
					onClose={() => {
						setIsPresetModalOpen(false);
						setPresetToEdit(null);
					}}
					onSubmit={handleSavePreset}
				/>
			)}

			{/* BARCODE TYPE MODAL */}
			{isBarcodeModalOpen && (
				<BarcodeTypeModal
					barcodeType={barcodeToEdit}
					isLoading={
						loadingAction === 'create-barcode' ||
						loadingAction === 'update-barcode'
					}
					onClose={() => {
						setIsBarcodeModalOpen(false);
						setBarcodeToEdit(null);
					}}
					onSubmit={handleSaveBarcodeType}
				/>
			)}

			{/* PASSWORD RESET MODAL */}
			{passwordModalUser && (
				<PasswordResetModal
					user={passwordModalUser}
					isLoading={loadingAction === 'password-reset'}
					onClose={() => setPasswordModalUser(null)}
					onSubmit={handleResetPassword}
				/>
			)}

			{/* USER DELETE CONFIRM MODAL */}
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

			{/* PRESET DELETE CONFIRM MODAL */}
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

			{/* BARCODE TYPE DELETE CONFIRM MODAL */}
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
