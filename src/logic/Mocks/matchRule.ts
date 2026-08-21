import { IMockRule, MockResponseType } from './IMockRule';

// This module is bundled into the MAIN-world script as well as the panel, so it must stay
// free of `~/` imports, React and any chrome.* access.

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toMethodRegExp = (pattern: string): RegExp => new RegExp(
  `^${ pattern.split('*').map(escapeRegExp).join('.*') }$`
);

export const matchesMethod = (pattern: string, method: string): boolean => {
  if (!pattern || typeof method !== 'string') {
    return false;
  }

  return pattern.includes('*')
    ? toMethodRegExp(pattern).test(method)
    : pattern === method;
};

export const matchRule = (rules: IMockRule[], method: string, url: string): IMockRule => (
  (rules || []).find((rule) => (
    rule.enabled &&
    matchesMethod(rule.method, method) &&
    (!rule.urlPattern || url.includes(rule.urlPattern))
  )) || null
);

export const parseMockBody = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch (e) {
    return body;
  }
};

export const isValidMockBody = (body: string): boolean => {
  try {
    JSON.parse(body);
    return true;
  } catch (e) {
    return false;
  }
};

export const buildMockBody = (rule: IMockRule, id: string | number): object => {
  const payload = parseMockBody(rule.body);

  return rule.responseType === MockResponseType.Error
    ? { jsonrpc: '2.0', id, error: payload }
    : { jsonrpc: '2.0', id, result: payload };
};
