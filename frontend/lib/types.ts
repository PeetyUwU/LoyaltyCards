export type AccessLevel = 'owner' | 'editor' | 'viewer';

export interface User {
	id: number;
	username: string;
	email: string;
}

export interface AdminUser {
	id: number;
	username: string;
	email: string;
	role_name: string;
	is_active: boolean;
}

export interface Token {
	access_token: string;
	token_type: string;
}

export interface Card {
	id: number;
	created_by: number;
	card_name: string;
	code: string;
	barcode_type_id: number | null;
	company_preset_id: number | null;
	color_scheme: string | null;
	added_at: string; // ISO datetime string
}

export interface SharedCard extends Card {
	access_level: AccessLevel;
	shared_by_username: string | null;
	shared_at: string | null;
}

export interface CardCreate {
	card_name: string;
	code: string;
	barcode_type_id?: number | null;
	company_preset_id?: number | null;
	color_scheme?: string | null;
}

export interface CardUpdate {
	card_name?: string;
	code?: string;
	barcode_type_id?: number | null;
	company_preset_id?: number | null;
	color_scheme?: string | null;
}

export interface Preset {
	id: number;
	name: string;
	image_url: string;
	color_scheme: string | null;
	barcode_type_id: number;
}

export interface BarcodeType {
	id: number;
	code: string;
	numeric_only: boolean;
	fixed_length: number | null;
	min_length: number | null;
	max_length: number | null;
}

export interface ShareRequest {
	user_id: number;
	access_level: Exclude<AccessLevel, 'owner'>;
}

export interface CardAccessOut {
	card_id: number;
	user_id: number;
	access_level: string;
}

export interface CardAccessWithUser {
	card_id: number;
	user_id: number;
	username: string;
	access_level: string;
}

export interface AppSettings {
	registration_enabled: boolean;
}
