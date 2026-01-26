export interface TargetingRule {
  type: 'user_id' | 'email' | 'percentage';
  operator?: 'in' | 'not_in'; // for user_id/email
  values?: string[]; // for user_id/email
  value?: number; // for percentage
  enabled: boolean;
}

export interface FeatureFlag {
  id: number;
  key: string;
  description?: string;
  is_active: boolean;
  targeting_rules: TargetingRule[];
}

export interface FeatureFlagCreate {
  key: string;
  description?: string;
  is_active: boolean;
  targeting_rules?: TargetingRule[];
}

export interface FeatureFlagUpdate {
  description?: string;
  is_active?: boolean;
  targeting_rules?: TargetingRule[];
}
