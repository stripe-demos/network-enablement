export interface FeaturesRow {
  [key: string]: unknown;
  id: string;
  name: string;
  'lookup-key': string;
  status: string;
}

// Anthropic product features — entitlements gated per subscription tier.
export const FEATURES_DATA: FeaturesRow[] = [
  { id: 'feat_01', name: 'Extended context (200K tokens)',  'lookup-key': 'extended_context_200k',   status: 'Active'   },
  { id: 'feat_02', name: 'Tool use / Function calling',     'lookup-key': 'tool_use',                status: 'Active'   },
  { id: 'feat_03', name: 'Vision (image understanding)',    'lookup-key': 'vision',                  status: 'Active'   },
  { id: 'feat_04', name: 'Computer use',                    'lookup-key': 'computer_use',            status: 'Active'   },
  { id: 'feat_05', name: 'Prompt caching',                  'lookup-key': 'prompt_caching',          status: 'Active'   },
  { id: 'feat_06', name: 'Batch API',                       'lookup-key': 'batch_api',               status: 'Active'   },
  { id: 'feat_07', name: 'Streaming responses',             'lookup-key': 'streaming',               status: 'Active'   },
  { id: 'feat_08', name: 'JSON mode',                       'lookup-key': 'json_mode',               status: 'Active'   },
  { id: 'feat_09', name: 'System prompts',                  'lookup-key': 'system_prompts',          status: 'Active'   },
  { id: 'feat_10', name: 'Enterprise SSO (SAML)',           'lookup-key': 'enterprise_sso',          status: 'Active'   },
  { id: 'feat_11', name: 'Audit logs',                      'lookup-key': 'audit_logs',              status: 'Active'   },
  { id: 'feat_12', name: 'Data residency (US / EU)',        'lookup-key': 'data_residency',          status: 'Active'   },
  { id: 'feat_13', name: 'Priority API access',             'lookup-key': 'priority_api_access',     status: 'Active'   },
  { id: 'feat_14', name: 'Role-based access control',       'lookup-key': 'rbac',                    status: 'Active'   },
  { id: 'feat_15', name: 'Usage analytics dashboard',       'lookup-key': 'usage_analytics',         status: 'Active'   },
  { id: 'feat_16', name: 'Claude for Slack',                'lookup-key': 'claude_for_slack',        status: 'Active'   },
  { id: 'feat_17', name: 'Custom system prompt (org-wide)', 'lookup-key': 'org_system_prompt',       status: 'Active'   },
  { id: 'feat_18', name: 'Context window — legacy (100K)',  'lookup-key': 'context_window_100k',     status: 'Archived' },
  { id: 'feat_19', name: 'Instant model access (Claude 1)','lookup-key': 'claude_instant_access',   status: 'Archived' },
  { id: 'feat_20', name: 'Legacy fine-tuning (v1)',         'lookup-key': 'fine_tuning_v1',          status: 'Archived' },
];
