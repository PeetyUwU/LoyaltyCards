import { apiFetch } from '@/lib/api';
import { AdminUser, AppSettings, Preset, BarcodeType } from '@/lib/types';
import AdminClient from './AdminClient';

export default async function AdminPage() {
	const [users, settings, presets, barcodeTypes] = await Promise.all([
		apiFetch<AdminUser[]>('/users/admin').catch(() => []),
		apiFetch<AppSettings>('/settings/').catch(() => ({
			registration_enabled: true,
		})),
		apiFetch<Preset[]>('/presets/').catch(() => []),
		apiFetch<BarcodeType[]>('/barcode-types/').catch(() => []),
	]);

	return (
		<AdminClient
			initialUsers={users}
			initialSettings={settings}
			initialPresets={presets}
			initialBarcodeTypes={barcodeTypes}
		/>
	);
}
