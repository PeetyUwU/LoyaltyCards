'use client';

import { useState } from 'react';
import { AdminUser } from '@/lib/types';
import { useTranslation } from '@/context/LanguageContext';

interface UserManagementTabProps {
	users: AdminUser[];
	currentUserId: number | null;
	loadingAction: string | null;
	onToggleStatus: (user: AdminUser) => void;
	onResetPassword: (user: AdminUser) => void;
	onDeleteUser: (user: AdminUser) => void;
}

export default function UserManagementTab({
	users,
	currentUserId,
	loadingAction,
	onToggleStatus,
	onResetPassword,
	onDeleteUser,
}: UserManagementTabProps) {
	const { t } = useTranslation();
	const [searchQuery, setSearchQuery] = useState('');

	const filteredUsers = users.filter(
		(u) =>
			u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.email.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
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
									const isOwner = user.role_name === 'owner';
									const canToggleStatus = !isSelf && !isOwner;

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
																onToggleStatus(
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
														onClick={() =>
															onResetPassword(
																user,
															)
														}
														className='rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition'
													>
														{t(
															'admin.users.reset_pass',
														)}
													</button>
													{!isOwner && !isSelf && (
														<button
															type='button'
															disabled={
																loadingAction ===
																`user-delete-${user.id}`
															}
															onClick={() =>
																onDeleteUser(
																	user,
																)
															}
															className='rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition'
														>
															{t('common.delete')}
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
	);
}
