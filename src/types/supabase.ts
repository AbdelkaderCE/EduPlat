export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					full_name: string | null;
					role: 'student' | 'admin';
				};
				Insert: {
					id: string;
					email: string;
					full_name?: string | null;
					role?: 'student' | 'admin';
				};
				Update: {
					id?: string;
					email?: string;
					full_name?: string | null;
					role?: 'student' | 'admin';
				};
				Relationships: [];
			};
			courses: {
				Row: {
					id: string;
					title: string;
					description: string | null;
					thumbnail_url: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					thumbnail_url?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					thumbnail_url?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			bundles: {
				Row: {
					id: string;
					title: string;
					description: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			bundle_courses: {
				Row: {
					bundle_id: string;
					course_id: string;
				};
				Insert: {
					bundle_id: string;
					course_id: string;
				};
				Update: {
					bundle_id?: string;
					course_id?: string;
				};
				Relationships: [];
			};
			user_access: {
				Row: {
					id: string;
					user_id: string;
					access_type: 'course' | 'bundle';
					access_id: string;
					granted_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					access_type: 'course' | 'bundle';
					access_id: string;
					granted_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					access_type?: 'course' | 'bundle';
					access_id?: string;
					granted_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			course_catalog: {
				Row: {
					id: string;
					title: string;
					created_at: string;
				};
				Relationships: [];
			};
			bundle_catalog: {
				Row: {
					id: string;
					title: string;
					created_at: string;
				};
				Relationships: [];
			};
		};
		Functions: Record<string, never>;
		Enums: {
			profile_role: 'student' | 'admin';
			access_item_type: 'course' | 'bundle';
		};
		CompositeTypes: Record<string, never>;
	};
};
