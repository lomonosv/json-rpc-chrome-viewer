import {
  IInterceptorRule,
  IJsonRpcItem,
  InterceptorResponseType
} from '~/logic/Interceptor/IInterceptorRule';

export const rulesStorageKey = 'interceptor_rules';
export const enabledStorageKey = 'interceptor_enabled';

const normaliseRule = (rule: Partial<IInterceptorRule>): IInterceptorRule => ({
  id: rule.id,
  isEnabled: rule.isEnabled ?? true,
  method: rule.method ?? '',
  url: rule.url ?? '',
  responseType: rule.responseType ?? InterceptorResponseType.Result,
  body: rule.body ?? '{}',
  status: rule.status ?? 200,
  delay: rule.delay ?? 0
});

export const createRule = (id: string): IInterceptorRule => normaliseRule({ id });

export const normaliseRules = (stored: unknown): IInterceptorRule[] => (
  Array.isArray(stored)
    ? stored.filter((rule) => rule?.id).map(normaliseRule)
    : []
);

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toMethodRegExp = (pattern: string): RegExp => new RegExp(
  `^${ pattern.split('*').map(escapeRegExp).join('.*') }$`
);

const matchesMethod = (pattern: string, method: string): boolean => {
  if (!pattern || typeof method !== 'string') {
    return false;
  }

  return pattern.includes('*')
    ? toMethodRegExp(pattern).test(method)
    : pattern === method;
};

export const isValidRuleBody = (body: string): boolean => {
  try {
    JSON.parse(body);

    return true;
  } catch (e) {
    return false;
  }
};

export const findRule = (rules: IInterceptorRule[], method: string, url: string): IInterceptorRule => (
  rules.find((rule) => (
    rule.isEnabled &&
    isValidRuleBody(rule.body) &&
    matchesMethod(rule.method, method) &&
    (!rule.url || url.includes(rule.url))
  )) || null
);

export const getRuleResponse = (rule: IInterceptorRule, id: string | number): IJsonRpcItem => ({
  jsonrpc: '2.0',
  id,
  [rule.responseType]: JSON.parse(rule.body)
});

export const getRuleStatus = (rule: IInterceptorRule): number => (
  Math.min(599, Math.max(200, rule.status || 200))
);
