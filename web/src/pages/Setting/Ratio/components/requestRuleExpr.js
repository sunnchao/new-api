export const SOURCE_PARAM = 'param';
export const SOURCE_HEADER = 'header';
export const SOURCE_TIME = 'time';
export const SOURCE_TOKEN_GROUP = 'token_group';

export const MATCH_EQ = 'eq';
export const MATCH_CONTAINS = 'contains';
export const MATCH_GT = 'gt';
export const MATCH_GTE = 'gte';
export const MATCH_LT = 'lt';
export const MATCH_LTE = 'lte';
export const MATCH_EXISTS = 'exists';
export const MATCH_RANGE = 'range';

export const REQUEST_RULE_ACTION_MULTIPLIER = 'multiplier';
export const REQUEST_RULE_ACTION_FIXED = 'fixed';

export const TIME_FUNCS = ['hour', 'minute', 'weekday', 'month', 'day'];

export const COMMON_TIMEZONES = [
  { value: 'Asia/Shanghai', label: 'UTC+8 北京 (Asia/Shanghai)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'UTC-5 纽约 (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'UTC-8 洛杉矶 (America/Los_Angeles)' },
  { value: 'America/Chicago', label: 'UTC-6 芝加哥 (America/Chicago)' },
  { value: 'Europe/London', label: 'UTC+0 伦敦 (Europe/London)' },
  { value: 'Europe/Berlin', label: 'UTC+1 柏林 (Europe/Berlin)' },
  { value: 'Asia/Tokyo', label: 'UTC+9 东京 (Asia/Tokyo)' },
  { value: 'Asia/Singapore', label: 'UTC+8 新加坡 (Asia/Singapore)' },
  { value: 'Asia/Seoul', label: 'UTC+9 首尔 (Asia/Seoul)' },
  { value: 'Australia/Sydney', label: 'UTC+10 悉尼 (Australia/Sydney)' },
];

export const NUMERIC_LITERAL_REGEX =
  /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

const REQUEST_RULE_WRAPPER = 'apply_request_rules';

export function createEmptyCondition() {
  return { source: SOURCE_PARAM, path: '', mode: MATCH_EQ, value: '' };
}

export function createEmptyTimeCondition() {
  return {
    source: SOURCE_TIME,
    timeFunc: 'hour',
    timezone: 'Asia/Shanghai',
    mode: MATCH_GTE,
    value: '',
    rangeStart: '',
    rangeEnd: '',
  };
}

export function createEmptyRuleGroup() {
  return {
    conditions: [createEmptyCondition()],
    actionType: REQUEST_RULE_ACTION_MULTIPLIER,
    multiplier: '',
    fixedPrice: '',
  };
}

export function createEmptyTimeRuleGroup() {
  return {
    conditions: [createEmptyTimeCondition()],
    actionType: REQUEST_RULE_ACTION_MULTIPLIER,
    multiplier: '',
    fixedPrice: '',
  };
}

export function createEmptyRequestRule() {
  return {
    source: SOURCE_PARAM,
    path: '',
    mode: MATCH_EQ,
    value: '',
    actionType: REQUEST_RULE_ACTION_MULTIPLIER,
    multiplier: '',
    fixedPrice: '',
  };
}

export function createEmptyTimeRule() {
  return {
    source: SOURCE_TIME,
    timeFunc: 'hour',
    timezone: 'Asia/Shanghai',
    mode: MATCH_GTE,
    value: '',
    rangeStart: '',
    rangeEnd: '',
    actionType: REQUEST_RULE_ACTION_MULTIPLIER,
    multiplier: '',
    fixedPrice: '',
  };
}

export function getRequestRuleMatchOptions(source, t) {
  if (source === SOURCE_TIME) {
    return [
      { value: MATCH_EQ, label: t('等于') },
      { value: MATCH_GTE, label: t('大于等于') },
      { value: MATCH_LT, label: t('小于') },
      { value: MATCH_RANGE, label: t('跨夜范围') },
    ];
  }
  const base = [
    { value: MATCH_EQ, label: t('等于') },
    { value: MATCH_CONTAINS, label: t('包含') },
    { value: MATCH_EXISTS, label: t('存在') },
  ];
  if (source === SOURCE_HEADER || source === SOURCE_TOKEN_GROUP) {
    return base;
  }
  return [
    ...base,
    { value: MATCH_GT, label: t('大于') },
    { value: MATCH_GTE, label: t('大于等于') },
    { value: MATCH_LT, label: t('小于') },
    { value: MATCH_LTE, label: t('小于等于') },
  ];
}

export function normalizeCondition(cond) {
  const source = cond?.source === SOURCE_TIME
    ? SOURCE_TIME
    : cond?.source === SOURCE_HEADER
      ? SOURCE_HEADER
      : cond?.source === SOURCE_TOKEN_GROUP
        ? SOURCE_TOKEN_GROUP
        : SOURCE_PARAM;

  if (source === SOURCE_TIME) {
    const timeFuncValue = cond?.timeFunc ?? cond?.time_func;
    const timeFunc = TIME_FUNCS.includes(timeFuncValue) ? timeFuncValue : 'hour';
    const options = getRequestRuleMatchOptions(SOURCE_TIME, (v) => v);
    const mode = options.some((item) => item.value === cond?.mode) ? cond.mode : MATCH_GTE;
    return {
      source: SOURCE_TIME,
      timeFunc,
      timezone: cond?.timezone || 'Asia/Shanghai',
      mode,
      value: cond?.value == null ? '' : String(cond.value),
      rangeStart:
        cond?.rangeStart == null && cond?.range_start == null
          ? ''
          : String(cond?.rangeStart ?? cond?.range_start),
      rangeEnd:
        cond?.rangeEnd == null && cond?.range_end == null
          ? ''
          : String(cond?.rangeEnd ?? cond?.range_end),
    };
  }

  const options = getRequestRuleMatchOptions(source, (v) => v);
  const mode = options.some((item) => item.value === cond?.mode) ? cond.mode : MATCH_EQ;
  return {
    source,
    path: source === SOURCE_TOKEN_GROUP ? '' : cond?.path || '',
    mode,
    value: cond?.value == null ? '' : String(cond.value),
  };
}

export function normalizeRequestRule(rule) {
  const base = normalizeCondition(rule);
  const actionType = (rule?.actionType ?? rule?.action_type) === REQUEST_RULE_ACTION_FIXED
    ? REQUEST_RULE_ACTION_FIXED
    : REQUEST_RULE_ACTION_MULTIPLIER;
  return {
    ...base,
    actionType,
    multiplier:
      actionType === REQUEST_RULE_ACTION_MULTIPLIER && rule?.multiplier != null
        ? String(rule.multiplier)
        : '',
    fixedPrice:
      actionType === REQUEST_RULE_ACTION_FIXED &&
      (rule?.fixedPrice != null || rule?.fixed_price != null)
        ? String(rule?.fixedPrice ?? rule?.fixed_price)
        : '',
  };
}

export function normalizeRuleGroup(group) {
  const actionType = (group?.actionType ?? group?.action_type) === REQUEST_RULE_ACTION_FIXED
    ? REQUEST_RULE_ACTION_FIXED
    : REQUEST_RULE_ACTION_MULTIPLIER;
  return {
    conditions: (group?.conditions || []).map(normalizeCondition),
    actionType,
    multiplier:
      actionType === REQUEST_RULE_ACTION_MULTIPLIER && group?.multiplier != null
        ? String(group.multiplier)
        : '',
    fixedPrice:
      actionType === REQUEST_RULE_ACTION_FIXED &&
      (group?.fixedPrice != null || group?.fixed_price != null)
        ? String(group?.fixedPrice ?? group?.fixed_price)
        : '',
  };
}

export function splitTopLevelMultiply(expr) {
  const parts = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < expr.length; index += 1) {
    const char = expr[index];
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth === 0 && expr.slice(index, index + 3) === ' * ') {
      parts.push(expr.slice(start, index).trim());
      start = index + 3;
      index += 2;
    }
  }
  parts.push(expr.slice(start).trim());
  return parts.filter(Boolean);
}

function splitTopLevelAnd(expr) {
  const parts = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i < expr.length; i += 1) {
    const c = expr[i];
    if (c === '(') depth += 1;
    if (c === ')') depth -= 1;
    if (depth === 0 && expr.slice(i, i + 4) === ' && ') {
      parts.push(expr.slice(start, i).trim());
      start = i + 4;
      i += 3;
    }
  }
  parts.push(expr.slice(start).trim());
  return parts.filter(Boolean);
}

function parseExprLiteral(raw) {
  const text = raw.trim();
  if (text === 'true' || text === 'false') return text;
  if (NUMERIC_LITERAL_REGEX.test(text)) return text;
  try { return JSON.parse(text); } catch { return null; }
}

function buildExprLiteral(mode, value) {
  const text = String(value || '').trim();
  if (mode === MATCH_CONTAINS) return JSON.stringify(text);
  if (text === 'true' || text === 'false') return text;
  if (NUMERIC_LITERAL_REGEX.test(text)) return text;
  return JSON.stringify(text);
}

function buildTimeConditionExpr(cond) {
  const normalized = normalizeCondition(cond);
  const { timeFunc, timezone, mode } = normalized;
  const tz = JSON.stringify(timezone);
  const fn = `${timeFunc}(${tz})`;

  if (mode === MATCH_RANGE) {
    const s = normalized.rangeStart.trim();
    const e = normalized.rangeEnd.trim();
    if (!NUMERIC_LITERAL_REGEX.test(s) || !NUMERIC_LITERAL_REGEX.test(e)) return '';
    return `${fn} >= ${s} || ${fn} < ${e}`;
  }
  const v = normalized.value.trim();
  if (!NUMERIC_LITERAL_REGEX.test(v)) return '';
  const opMap = { [MATCH_EQ]: '==', [MATCH_GTE]: '>=', [MATCH_LT]: '<' };
  return `${fn} ${opMap[mode] || '=='} ${v}`;
}

function buildLegacyRequestConditionExpr(cond) {
  if (cond?.source === SOURCE_TIME) return buildTimeConditionExpr(cond);
  if (cond?.source === SOURCE_TOKEN_GROUP) return '';

  const normalized = normalizeCondition(cond);
  const path = normalized.path.trim();
  if (!path) return '';

  const sourceExpr = normalized.source === SOURCE_HEADER
    ? `header(${JSON.stringify(path)})`
    : `param(${JSON.stringify(path)})`;

  switch (normalized.mode) {
    case MATCH_EXISTS:
      return normalized.source === SOURCE_HEADER
        ? `${sourceExpr} != ""`
        : `${sourceExpr} != nil`;
    case MATCH_CONTAINS:
      return normalized.source === SOURCE_HEADER
        ? `has(${sourceExpr}, ${buildExprLiteral(normalized.mode, normalized.value)})`
        : `${sourceExpr} != nil && has(${sourceExpr}, ${buildExprLiteral(normalized.mode, normalized.value)})`;
    case MATCH_GT: case MATCH_GTE: case MATCH_LT: case MATCH_LTE: {
      const opMap = { [MATCH_GT]: '>', [MATCH_GTE]: '>=', [MATCH_LT]: '<', [MATCH_LTE]: '<=' };
      if (!NUMERIC_LITERAL_REGEX.test(String(normalized.value).trim())) return '';
      return `${sourceExpr} != nil && ${sourceExpr} ${opMap[normalized.mode]} ${String(normalized.value).trim()}`;
    }
    case MATCH_EQ:
    default:
      return `${sourceExpr} == ${buildExprLiteral(normalized.mode, normalized.value)}`;
  }
}

function buildLegacyRuleGroupFactor(group) {
  const multiplier = (group.multiplier || '').trim();
  if (!NUMERIC_LITERAL_REGEX.test(multiplier)) return '';
  const condExprs = (group.conditions || [])
    .map(buildLegacyRequestConditionExpr)
    .filter(Boolean);
  if (condExprs.length === 0) return '';

  const combined = condExprs.length === 1
    ? condExprs[0]
    : condExprs.map((e) => (e.includes(' || ') ? `(${e})` : e)).join(' && ');
  return `(${combined} ? ${multiplier} : 1)`;
}

function tryParseTimeCondition(expr) {
  let m = expr.match(
    /^(hour|minute|weekday|month|day)\("([^"]+)"\) >= ([\d.eE+-]+) \|\| \1\("\2"\) < ([\d.eE+-]+)$/,
  );
  if (m) {
    return {
      source: SOURCE_TIME, timeFunc: m[1], timezone: m[2],
      mode: MATCH_RANGE, value: '', rangeStart: m[3], rangeEnd: m[4],
    };
  }
  m = expr.match(
    /^\((hour|minute|weekday|month|day)\("([^"]+)"\) >= ([\d.eE+-]+) \|\| \1\("\2"\) < ([\d.eE+-]+)\)$/,
  );
  if (m) {
    return {
      source: SOURCE_TIME, timeFunc: m[1], timezone: m[2],
      mode: MATCH_RANGE, value: '', rangeStart: m[3], rangeEnd: m[4],
    };
  }
  m = expr.match(
    /^(hour|minute|weekday|month|day)\("([^"]+)"\) (==|>=|<) ([\d.eE+-]+)$/,
  );
  if (m) {
    const opMap = { '==': MATCH_EQ, '>=': MATCH_GTE, '<': MATCH_LT };
    return {
      source: SOURCE_TIME, timeFunc: m[1], timezone: m[2],
      mode: opMap[m[3]] || MATCH_EQ, value: m[4], rangeStart: '', rangeEnd: '',
    };
  }
  return null;
}

function tryParseLegacyRequestCondition(expr) {
  const tc = tryParseTimeCondition(expr);
  if (tc) return tc;

  let m = expr.match(/^header\("([^"]+)"\) != ""$/);
  if (m) return { source: SOURCE_HEADER, path: m[1], mode: MATCH_EXISTS, value: '' };

  m = expr.match(/^param\("([^"]+)"\) != nil$/);
  if (m) return { source: SOURCE_PARAM, path: m[1], mode: MATCH_EXISTS, value: '' };

  m = expr.match(/^has\(header\("([^"]+)"\), ((?:"(?:[^"\\]|\\.)*"))\)$/);
  if (m) return { source: SOURCE_HEADER, path: m[1], mode: MATCH_CONTAINS, value: JSON.parse(m[2]) };

  m = expr.match(/^param\("([^"]+)"\) != nil && has\(param\("([^"]+)"\), ((?:"(?:[^"\\]|\\.)*"))\)$/);
  if (m && m[1] === m[2]) return { source: SOURCE_PARAM, path: m[1], mode: MATCH_CONTAINS, value: JSON.parse(m[3]) };

  m = expr.match(/^param\("([^"]+)"\) != nil && param\("([^"]+)"\) (>|>=|<|<=) ([\d.eE+-]+)$/);
  if (m && m[1] === m[2]) {
    const opMap = { '>': MATCH_GT, '>=': MATCH_GTE, '<': MATCH_LT, '<=': MATCH_LTE };
    return { source: SOURCE_PARAM, path: m[1], mode: opMap[m[3]], value: m[4] };
  }

  m = expr.match(/^(param|header)\("([^"]+)"\) == (.+)$/);
  if (m) {
    const parsedValue = parseExprLiteral(m[3]);
    if (parsedValue === null) return null;
    return { source: m[1], path: m[2], mode: MATCH_EQ, value: String(parsedValue) };
  }

  return null;
}

function tryParseLegacyRuleGroupFactor(part) {
  const m = part.match(/^\((.+) \? ([\d.eE+-]+) : 1\)$/s);
  if (!m) return null;

  const conditionStr = m[1];
  const multiplier = m[2];

  const andParts = splitTopLevelAnd(conditionStr);
  const conditions = [];
  for (const ap of andParts) {
    const cond = tryParseLegacyRequestCondition(ap.trim());
    if (!cond) return null;
    conditions.push(normalizeCondition(cond));
  }
  if (conditions.length === 0) return null;
  return {
    conditions,
    actionType: REQUEST_RULE_ACTION_MULTIPLIER,
    multiplier,
    fixedPrice: '',
  };
}

function tryParseLegacyRequestRuleExpr(expr) {
  const trimmed = (expr || '').trim();
  if (!trimmed) return [];

  const parts = splitTopLevelMultiply(trimmed);
  const groups = [];
  for (const part of parts) {
    const group = tryParseLegacyRuleGroupFactor(part);
    if (!group) return null;
    groups.push(group);
  }
  return groups;
}

function splitVersionPrefix(expr) {
  const trimmed = (expr || '').trim();
  const m = trimmed.match(/^(v\d+:)([\s\S]+)$/);
  if (!m) {
    return { versionPrefix: '', body: trimmed };
  }
  return {
    versionPrefix: m[1],
    body: m[2].trim(),
  };
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUtf8(text) {
  const binary = atob(text);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeRequestRulePayload(groups) {
  return utf8ToBase64(JSON.stringify({
    version: 1,
    groups: groups.map((group) => ({
      conditions: (group.conditions || []).map((cond) => (
        cond.source === SOURCE_TIME
          ? {
            source: cond.source,
            mode: cond.mode,
            value: cond.value,
            time_func: cond.timeFunc,
            timezone: cond.timezone,
            range_start: cond.rangeStart,
            range_end: cond.rangeEnd,
          }
          : {
            source: cond.source,
            path: cond.path,
            mode: cond.mode,
            value: cond.value,
          }
      )),
      action_type: group.actionType,
      multiplier: group.multiplier,
      fixed_price: group.fixedPrice,
    })),
  }));
}

function decodeRequestRulePayload(payload) {
  try {
    const decoded = base64ToUtf8((payload || '').trim());
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed?.groups)) return null;
    return parsed.groups.map(normalizeRuleGroup);
  } catch {
    return null;
  }
}

function hasFullOuterParens(expr) {
  if (!expr.startsWith('(') || !expr.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < expr.length; i += 1) {
    if (expr[i] === '(') depth += 1;
    if (expr[i] === ')') depth -= 1;
    if (depth === 0 && i < expr.length - 1) return false;
  }
  return depth === 0;
}

export function unwrapOuterParens(expr) {
  let current = (expr || '').trim();
  while (hasFullOuterParens(current)) {
    current = current.slice(1, -1).trim();
  }
  return current;
}

function parseApplyRequestRulesWrapper(exprBody) {
  const body = (exprBody || '').trim();
  const prefix = `${REQUEST_RULE_WRAPPER}(`;
  if (!body.startsWith(prefix) || !body.endsWith(')')) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let splitIndex = -1;

  for (let i = prefix.length; i < body.length - 1; i += 1) {
    const char = body[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '(') {
      depth += 1;
      continue;
    }
    if (char === ')') {
      if (depth === 0) {
        return null;
      }
      depth -= 1;
      continue;
    }
    if (char === ',' && depth === 0) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex === -1) return null;

  const baseArg = body.slice(prefix.length, splitIndex).trim();
  const payloadArg = body.slice(splitIndex + 1, -1).trim();
  if (!payloadArg) return null;

  try {
    return {
      billingExpr: unwrapOuterParens(baseArg),
      requestRuleExpr: JSON.parse(payloadArg),
    };
  } catch {
    return null;
  }
}

function normalizeGroupsForPayload(groups) {
  return (groups || [])
    .map(normalizeRuleGroup)
    .filter((group) => {
      if (!Array.isArray(group.conditions) || group.conditions.length === 0) {
        return false;
      }
      if (group.actionType === REQUEST_RULE_ACTION_FIXED) {
        return NUMERIC_LITERAL_REGEX.test((group.fixedPrice || '').trim());
      }
      return NUMERIC_LITERAL_REGEX.test((group.multiplier || '').trim());
    });
}

export function buildRequestRuleExpr(groups) {
  const normalizedGroups = normalizeGroupsForPayload(groups);
  if (normalizedGroups.length === 0) {
    return '';
  }
  return encodeRequestRulePayload(normalizedGroups);
}

export function tryParseRequestRuleExpr(expr) {
  const trimmed = (expr || '').trim();
  if (!trimmed) return [];

  const decoded = decodeRequestRulePayload(trimmed);
  if (decoded) {
    return decoded;
  }

  return tryParseLegacyRequestRuleExpr(trimmed);
}

export function combineBillingExpr(baseExpr, requestRuleExpr) {
  const base = (baseExpr || '').trim();
  const rules = (requestRuleExpr || '').trim();
  if (!base) return '';
  if (!rules) return base;

  const { versionPrefix, body } = splitVersionPrefix(base);
  // Wrap base billing with the dedicated request-rule helper so fixed-price
  // and multiplier actions share one execution path in the backend.
  return `${versionPrefix}${REQUEST_RULE_WRAPPER}((${body}), ${JSON.stringify(rules)})`;
}

function splitLegacyCombinedExpr(exprBody) {
  const trimmed = (exprBody || '').trim();
  if (!trimmed) return { billingExpr: '', requestRuleExpr: '' };

  const parts = splitTopLevelMultiply(trimmed);
  if (parts.length <= 1) return { billingExpr: trimmed, requestRuleExpr: '' };

  const ruleParts = [];
  const baseParts = [];

  parts.forEach((part) => {
    const parsed = tryParseLegacyRequestRuleExpr(part);
    if (parsed !== null && parsed.length > 0) {
      ruleParts.push(part);
    } else {
      baseParts.push(part);
    }
  });

  if (ruleParts.length === 0 || baseParts.length !== 1) {
    return { billingExpr: trimmed, requestRuleExpr: '' };
  }

  return {
    billingExpr: unwrapOuterParens(baseParts[0]),
    requestRuleExpr: encodeRequestRulePayload(ruleParts
      .map((part) => tryParseLegacyRuleGroupFactor(part))
      .filter(Boolean)),
  };
}

export function splitBillingExprAndRequestRules(expr) {
  const trimmed = (expr || '').trim();
  if (!trimmed) return { billingExpr: '', requestRuleExpr: '' };

  const { versionPrefix, body } = splitVersionPrefix(trimmed);
  const wrapped = parseApplyRequestRulesWrapper(body);
  if (wrapped) {
    return {
      billingExpr: `${versionPrefix}${wrapped.billingExpr}`,
      requestRuleExpr: wrapped.requestRuleExpr,
    };
  }

  const legacy = splitLegacyCombinedExpr(body);
  return {
    billingExpr: legacy.billingExpr ? `${versionPrefix}${legacy.billingExpr}` : '',
    requestRuleExpr: legacy.requestRuleExpr,
  };
}

// Backward-compat helper kept for any legacy caller that still wants the old
// inline multiplier expression form.
export function buildLegacyRequestRuleExpr(groups) {
  return (groups || []).map(buildLegacyRuleGroupFactor).filter(Boolean).join(' * ');
}
