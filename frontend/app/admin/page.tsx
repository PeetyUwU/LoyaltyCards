import { apiFetch } from '@/lib/api';
import { AdminUser } from '@/lib/types';
import AdminClient from './AdminClient';

export default async function AdminPage() {
	const users = await apiFetch<AdminUser[]>('/users/admin');
	return <AdminClient initialUsers={users} />;
}
