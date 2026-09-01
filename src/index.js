// Apex Edge Worker v1.1.5 — generated from drip-apex-labs/Apex packages/edge-worker — do not edit here.
// ../event-schema/src/experiment-servability.ts
function isExperimentServable(experiment, context) {
  if (!experiment || experiment.runtime_disabled === true) return false;
  const environment = context.environment.trim().toLowerCase() || "production";
  const experimentEnvironment = experiment.environment_key?.trim().toLowerCase();
  if (experimentEnvironment && experimentEnvironment !== environment) return false;
  if (experiment.status === "running") return true;
  return context.qaMode === true && (experiment.status === "qa" || experiment.status === "draft" || experiment.status === "awaiting_client_approval" || experiment.status === "changes_requested" || experiment.status === "client_approved" || experiment.status === "ready_to_launch" || experiment.status === "paused" || experiment.status === "completed");
}

// ../shared-runtime/src/currency.ts
var ISO_4217_CURRENCY_CODES = `AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XCD XCG XDR XOF XPF XSU YER ZAR ZMW ZWG`.split(
  " "
);
var ISO_4217_CURRENCY_CODE_SET = new Set(ISO_4217_CURRENCY_CODES);

// ../shared-runtime/src/bucketing.ts
function murmurhash3_32_gc(key, seed = 0) {
  let remainder = key.length & 3;
  let bytes = key.length - remainder;
  let h1 = seed;
  let c1 = 3432918353;
  let c2 = 461845907;
  let i = 0;
  while (i < bytes) {
    let k12 = key.charCodeAt(i) & 255 | (key.charCodeAt(++i) & 255) << 8 | (key.charCodeAt(++i) & 255) << 16 | (key.charCodeAt(++i) & 255) << 24;
    ++i;
    k12 = Math.imul(k12, c1);
    k12 = k12 << 15 | k12 >>> 17;
    k12 = Math.imul(k12, c2);
    h1 ^= k12;
    h1 = h1 << 13 | h1 >>> 19;
    h1 = Math.imul(h1, 5) + 3864292196;
  }
  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 255) << 16;
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 255) << 8;
    case 1:
      k1 ^= key.charCodeAt(i) & 255;
      k1 = Math.imul(k1, c1);
      k1 = k1 << 15 | k1 >>> 17;
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 2246822507);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 3266489909);
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}
function hashToFloat(seed, value) {
  const hash = murmurhash3_32_gc(seed + value, 1);
  return hash % 1e4 / 1e4;
}
function variationHashToFloat(experimentId, value) {
  return hashToFloat(`${experimentId}:variation`, value);
}
function inTrafficAllocation(hashValue, allocation = 1) {
  if (allocation <= 0) return false;
  if (allocation >= 1) return true;
  return hashValue < allocation;
}
function chooseVariation(hashValue, weights) {
  if (!weights.length) return -1;
  const total = weights.reduce((sum, w) => sum + (w > 0 ? w : 0), 0);
  if (total <= 0) return 0;
  const n = hashValue * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] > 0 ? weights[i] : 0;
    if (n < acc) return i;
  }
  return weights.length - 1;
}

// ../edge-engine/src/deps.ts
var DRIP_UID_COOKIE = "drip_uid";
var DRIP_QA_FORCE_COOKIE = "drip_qa_force";
var DRIP_EXCLUSION_GROUP_COOKIE = "drip_xgroups_v1";
var DRIP_ASSIGN_USER_HASH_KEY = "__assign_user_hash";
var DRIP_REDIRECT_LOOP_COOKIE = "drip_rt";
var DRIP_REDIRECT_ATTR_COOKIE = "drip_ra";
var EDGE_SOURCE_HEADER = "x-drip-edge";
function bytesToHex(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}
function readFirstSearchParam(params, names) {
  for (const name of names) {
    const value = params.get(name)?.trim();
    if (value) return value;
  }
  return null;
}
function readForceSearchParam(params) {
  const canonical = params.get("drip_force");
  if (canonical !== null) {
    const raw = canonical.trim();
    return !raw || raw.toLowerCase() === "clear" ? null : raw;
  }
  const experimentId = readFirstSearchParam(params, [
    "drip_experiment_id",
    "drip_experiment",
    "experiment_id",
    "experimentId",
    "expId"
  ]);
  const variationId = readFirstSearchParam(params, [
    "drip_variation_id",
    "drip_variation",
    "variation_id",
    "variationId",
    "varId"
  ]);
  return experimentId && variationId ? `${experimentId}:${variationId}` : null;
}
function hasForceClearSearchParam(params) {
  return params.get("drip_force")?.trim().toLowerCase() === "clear";
}

// ../shared-runtime/src/weekday-schedule.ts
var WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];
var warnedInvalidTimezones = /* @__PURE__ */ new Set();
function normalizeWeekdaySchedule(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value;
  if (Object.keys(record).some(
    (key) => key !== "excludedDays" && key !== "timezone"
  )) {
    return null;
  }
  if (!Array.isArray(record.excludedDays)) return null;
  if (!record.excludedDays.every(
    (day) => typeof day === "string" && WEEKDAYS.includes(day)
  )) {
    return null;
  }
  const excludedDays = Array.from(new Set(record.excludedDays));
  if (excludedDays.length < 1 || excludedDays.length > 6) return null;
  if (typeof record.timezone !== "string") return null;
  const timezone = record.timezone.trim();
  if (!timezone) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    return null;
  }
  return { excludedDays, timezone };
}
function warningTimezone(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? String(value.timezone ?? "unknown") : "unknown";
}
function isWeekdayExcluded(schedule, now) {
  if (!schedule) return false;
  try {
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: schedule.timezone
    }).format(now).toLowerCase();
    return Array.isArray(schedule.excludedDays) && schedule.excludedDays.includes(weekday);
  } catch {
    return false;
  }
}
function weekdayScheduleBlocksDelivery(schedule, now, logPrefix) {
  if (schedule == null) return false;
  const normalized = normalizeWeekdaySchedule(schedule);
  if (!normalized) {
    const timezone = warningTimezone(schedule);
    const warnKey = `${logPrefix}:${timezone}`;
    if (!warnedInvalidTimezones.has(warnKey)) {
      warnedInvalidTimezones.add(warnKey);
      console.warn(
        `${logPrefix} Invalid weekday schedule (timezone "${timezone}" or malformed shape); delivery will fail open.`
      );
    }
    return false;
  }
  return isWeekdayExcluded(normalized, now);
}

// ../edge-engine/src/weekday-schedule.ts
function weekdayScheduleBlocksDelivery2(schedule, now) {
  return weekdayScheduleBlocksDelivery(schedule, now, "[drip-worker]");
}

// ../edge-engine/src/sdk-injection-rewriter.ts
function escapeHtmlAttribute(value) {
  return value.replace(/[&"'<>]/g, (character) => ({
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#39;",
    "<": "&lt;",
    ">": "&gt;"
  })[character]);
}
function resolveSdkScriptUrl(shopId, advertised) {
  if (advertised) {
    try {
      const url = new URL(advertised);
      if (url.protocol === "https:" && url.username === "" && url.password === "") {
        return url.toString();
      }
    } catch {
    }
  }
  return `https://events.drip-apex.com/s/${encodeURIComponent(shopId)}.js`;
}
function appendSdkWhenMissing(rewriter, options) {
  const encodedShopId = encodeURIComponent(options.shopId);
  const scriptUrl = resolveSdkScriptUrl(options.shopId, options.scriptUrl);
  const state = { found: false, inserted: false };
  const markFound = (element) => {
    state.found = true;
    options.onFound?.(element);
  };
  rewriter.on('script[src^="https://events.drip-apex.com/s/"]', { element: markFound });
  rewriter.on('script[src^="https://sdk.drip-apex.com/"]', { element: markFound });
  rewriter.on(`script[src="${scriptUrl.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"]`, { element: markFound });
  rewriter.on(`script[src$="/s/${encodedShopId}.js"]`, { element: markFound });
  rewriter.on(`script[src*="/s/${encodedShopId}.js?"]`, { element: markFound });
  rewriter.on("script[data-apex-install-surface]", { element: markFound });
  const installAtEnd = (element) => {
    element.onEndTag((endTag) => {
      if (state.found || state.inserted) return;
      endTag.before(options.buildInjectedTag(encodedShopId), { html: true });
      state.inserted = true;
    });
  };
  rewriter.on("body", { element: installAtEnd });
  rewriter.on("html", { element: installAtEnd });
}

// ../edge-engine/src/index.ts
function randomHexId(size = 16) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}
function parseCookieValue(cookieHeader, key) {
  if (!cookieHeader) return null;
  const pattern = new RegExp("(^|;\\s*)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]+)");
  const match = cookieHeader.match(pattern);
  return match ? decodeURIComponent(match[2]) : null;
}
function makeVisitorCookie(value) {
  return DRIP_UID_COOKIE + "=" + encodeURIComponent(value) + "; Max-Age=31536000; Path=/; SameSite=Lax";
}
function evalSimpleUrlPart(actual, pattern, isPath) {
  try {
    let escaped = pattern.replace(/[*.+?^${}()|[\]\\]/g, "\\$&").replace(/_____/g, ".*");
    if (isPath) {
      escaped = "\\/?" + escaped.replace(/(^\/|\/$)/g, "") + "\\/?";
    }
    return new RegExp("^" + escaped + "$", "i").test(actual);
  } catch {
    return false;
  }
}
function evalSimpleUrlTarget(actual, pattern) {
  try {
    const expected = new URL(
      pattern.replace(/^([^:/?]*)\./i, "https://$1.").replace(/\*/g, "_____"),
      "https://_____"
    );
    const comps = [
      [actual.host, expected.host, false],
      [actual.pathname, expected.pathname, true]
    ];
    if (expected.hash) comps.push([actual.hash, expected.hash, false]);
    expected.searchParams.forEach((v, k) => {
      comps.push([actual.searchParams.get(k) || "", v, false]);
    });
    return !comps.some((c) => !evalSimpleUrlPart(c[0], c[1], c[2]));
  } catch {
    return false;
  }
}
function unescapeRegexLiteral(value) {
  return value.replace(/\\([.*+?^${}()|[\]\\\/])/g, "$1");
}
function evalUrlRule(url, rule) {
  try {
    if (!rule.pattern) return false;
    const parsed = new URL(url, "https://_");
    const matchType = rule.matchType ?? rule.match_type;
    if (matchType === "contains") {
      const actual = parsed.href.toLowerCase();
      const pattern = rule.pattern.toLowerCase();
      return actual.includes(pattern) || actual.includes(unescapeRegexLiteral(pattern));
    }
    if (rule.type === "regex") {
      const escaped = rule.pattern.replace(/([^\\])\//g, "$1\\/");
      const regex = new RegExp(escaped);
      return regex.test(parsed.href) || regex.test(parsed.href.substring(parsed.origin.length));
    }
    return evalSimpleUrlTarget(parsed, rule.pattern);
  } catch {
    return false;
  }
}
function matchUrlRules(url, rules) {
  if (!rules.length) return true;
  let hasInclude = false;
  let included = false;
  for (const rule of rules) {
    const matched = evalUrlRule(url, rule);
    if (rule.include === false) {
      if (matched) return false;
    } else {
      hasInclude = true;
      if (matched) included = true;
    }
  }
  return included || !hasInclude;
}
function matchEdgePageRule(url, rule) {
  if (rule.disabled || rule.trigger?.disabled) return false;
  const includeRules = Array.isArray(rule.includeRules) ? rule.includeRules : [];
  const excludeRules = Array.isArray(rule.excludeRules) ? rule.excludeRules.map((item) => ({ ...item, include: false })) : [];
  return matchUrlRules(url, [...includeRules, ...excludeRules]);
}
function matchEdgePageRules(url, rules) {
  if (!rules.length) return true;
  let hasInclude = false;
  let included = false;
  for (const rule of rules) {
    const matched = matchEdgePageRule(url, rule);
    if (rule.include === false) {
      if (matched) return false;
    } else {
      hasInclude = true;
      if (matched) included = true;
    }
  }
  return included || !hasInclude;
}
var EDGE_SEGMENT_CONDITION_OPERATORS = /* @__PURE__ */ new Set([
  "equals",
  "contains",
  "matches_wildcard",
  "matches_regex"
]);
function edgeSegmentConditionOperatorIsSupported(operator) {
  return typeof operator === "string" && EDGE_SEGMENT_CONDITION_OPERATORS.has(operator);
}
function matchEdgeSegmentCondition(url, country, condition) {
  if (!edgeSegmentConditionOperatorIsSupported(condition.operator)) return false;
  let actual = "";
  try {
    const parsed = new URL(url, "https://_");
    if (condition.signal === "url.full") actual = parsed.href;
    else if (condition.signal === "url.path") actual = parsed.pathname;
    else if (condition.signal === "url.query") actual = parsed.search;
    else if (condition.signal === "geo.country") actual = country ?? "";
    else return false;
  } catch {
    return false;
  }
  const expected = String(condition.value ?? "");
  if (!expected && condition.operator !== "equals") return false;
  if (condition.operator === "equals") return actual === expected;
  if (condition.operator === "contains") return actual.includes(expected);
  if (condition.operator === "matches_wildcard") {
    const escaped = expected.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    try {
      return new RegExp(`^${escaped}$`).test(actual);
    } catch {
      return false;
    }
  }
  if (condition.operator === "matches_regex") {
    try {
      return new RegExp(expected).test(actual);
    } catch {
      return false;
    }
  }
  return false;
}
function matchEdgeSegmentRule(url, country, rule) {
  const groups = Array.isArray(rule.rules?.groups) ? rule.rules.groups.filter((group) => Array.isArray(group) && group.length > 0) : [];
  if (groups.length) {
    return groups.every(
      (group) => group.some((condition) => matchEdgeSegmentCondition(url, country, condition))
    );
  }
  const conditions = Array.isArray(rule.rules?.conditions) ? rule.rules.conditions : [];
  if (!conditions.length) return true;
  const operator = rule.rules?.operator === "or" ? "or" : "and";
  return operator === "or" ? conditions.some((condition) => matchEdgeSegmentCondition(url, country, condition)) : conditions.every((condition) => matchEdgeSegmentCondition(url, country, condition));
}
function matchEdgeSegmentRules(url, country, rules) {
  if (!rules.length) return true;
  let hasInclude = false;
  let included = false;
  for (const rule of rules) {
    const matched = matchEdgeSegmentRule(url, country, rule);
    if (rule.include === false) {
      if (matched) return false;
    } else {
      hasInclude = true;
      if (matched) included = true;
    }
  }
  return included || !hasInclude;
}
function edgeSegmentRulesAreUrlOnly(rules) {
  return rules.every((rule) => {
    const groupedConditions = Array.isArray(rule.rules?.groups) ? rule.rules.groups.flat() : [];
    const conditions = groupedConditions.length ? groupedConditions : Array.isArray(rule.rules?.conditions) ? rule.rules.conditions : [];
    if (!conditions.length) return false;
    return conditions.every(
      (condition) => condition.js == null && edgeSegmentConditionOperatorIsSupported(condition.operator) && (condition.signal === "url.full" || condition.signal === "url.path" || condition.signal === "url.query" || condition.signal === "geo.country")
    );
  });
}
function edgeAudienceTargetingIsWorkerReproducible(targeting) {
  if (targeting.deviceType != null && targeting.deviceType !== "all") return false;
  if (Array.isArray(targeting.attributes) && targeting.attributes.length > 0) return false;
  if (Array.isArray(targeting.segments) && targeting.segments.length > 0) {
    const expandedSegmentRules = Array.isArray(targeting.segmentRules) ? targeting.segmentRules : [];
    if (!targeting.segments.every(
      (segment) => typeof segment.id === "string" && expandedSegmentRules.some((rule) => rule.id === segment.id)
    )) return false;
  }
  if (Array.isArray(targeting.segmentRules) && !edgeSegmentRulesAreUrlOnly(targeting.segmentRules)) return false;
  return true;
}
function edgeUrlTargetingIsWorkerReproducible(targeting) {
  return !Array.isArray(targeting.pageRules) || targeting.pageRules.every(edgePageRuleIsUrlDriven);
}
function edgePageRuleIsUrlDriven(rule) {
  if (!rule || typeof rule !== "object") return false;
  const mode = rule.trigger?.mode;
  return !rule.advancedCondition?.code?.trim() && !rule.trigger?.triggerJs?.trim() && mode !== "manual-callback" && mode !== "manual-api";
}
function matchesEdgeAudienceTargeting(targeting, url, country) {
  if (!targeting) return true;
  if (!edgeAudienceTargetingIsWorkerReproducible(targeting)) return false;
  if (Array.isArray(targeting.segmentRules)) {
    if (!matchEdgeSegmentRules(url, country, targeting.segmentRules)) return false;
  }
  return true;
}
function matchesEdgeUrlTargeting(targeting, url) {
  if (!targeting) return true;
  if (!edgeUrlTargetingIsWorkerReproducible(targeting)) return false;
  if (Array.isArray(targeting.url) && !matchUrlRules(url, targeting.url)) {
    return false;
  }
  if (Array.isArray(targeting.pageRules) && !matchEdgePageRules(url, targeting.pageRules)) {
    return false;
  }
  return true;
}
function parseForceMapValue(raw) {
  if (!raw) return {};
  const map = {};
  for (const pair of raw.split(",")) {
    const [expId, varId] = pair.split(":");
    if (expId && varId) map[expId] = varId;
  }
  return map;
}
function parseForceMapFromUrl(url) {
  try {
    return parseForceMapValue(readForceSearchParam(new URL(url).searchParams));
  } catch {
    return {};
  }
}
function resolveEdgeForceMap(url, cookieHeader) {
  try {
    const params = new URL(url).searchParams;
    if (hasForceClearSearchParam(params)) return {};
    const rawUrlForce = readForceSearchParam(params);
    if (rawUrlForce) return parseForceMapValue(rawUrlForce);
    return parseForceMapValue(
      parseCookieValue(cookieHeader, DRIP_QA_FORCE_COOKIE)
    );
  } catch {
    return {};
  }
}
function isEdgeQaMode(url, cookieHeader) {
  try {
    const params = new URL(url).searchParams;
    if (hasForceClearSearchParam(params)) return false;
    const screenshotMode = params.get("drip_screenshot") === "1" || params.get("drip_screenshot") === "true";
    if (screenshotMode) return true;
    if (params.get("drip_qa") === "1") return true;
    if ((params.get("drip_debug") === "1" || params.get("apex_debug") === "1" || params.get("drip_devtools") === "1") && readForceSearchParam(params)) {
      return true;
    }
  } catch {
  }
  return Boolean(parseCookieValue(cookieHeader, DRIP_QA_FORCE_COOKIE));
}
function parseEdgeExclusionStickySelections(cookieHeader, expectedAssignUserHash) {
  const selections = /* @__PURE__ */ new Map();
  let raw;
  try {
    raw = parseCookieValue(cookieHeader, DRIP_EXCLUSION_GROUP_COOKIE);
  } catch {
    return selections;
  }
  if (!raw) return selections;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return selections;
    }
    if (expectedAssignUserHash !== void 0 && parsed[DRIP_ASSIGN_USER_HASH_KEY] !== expectedAssignUserHash) {
      return selections;
    }
    for (const [groupId, value] of Object.entries(parsed)) {
      if (groupId && Array.isArray(value) && typeof value[0] === "string" && value[0] && Number.isSafeInteger(value[1]) && value[1] > 0) {
        selections.set(groupId, {
          experimentId: value[0],
          epoch: value[1]
        });
      }
    }
  } catch {
  }
  return selections;
}
function normalizeEdgeGoals(goals) {
  if (!Array.isArray(goals)) return [];
  const normalized = [];
  for (const goal of goals) {
    if (!goal || typeof goal !== "object") continue;
    const id = typeof goal.id === "string" ? goal.id : "";
    const type = typeof goal.type === "string" ? goal.type : void 0;
    if (!id || type !== "click" && type !== "pageview") continue;
    const selector = typeof goal.selector === "string" ? goal.selector : void 0;
    const textMatch = typeof goal.textMatch === "string" ? goal.textMatch : void 0;
    const urlPattern = typeof goal.urlPattern === "string" ? goal.urlPattern : void 0;
    const pageId = typeof goal.pageId === "string" ? goal.pageId : void 0;
    const countOnce = Boolean(goal.countOnce);
    const capture = Array.isArray(goal.capture) ? goal.capture.filter((rule) => rule && typeof rule === "object").map((rule) => ({
      property: typeof rule.property === "string" ? rule.property : void 0,
      source: typeof rule.source === "string" ? rule.source : void 0,
      attribute: typeof rule.attribute === "string" ? rule.attribute : void 0
    })).filter((rule) => rule.property && (rule.source === "attribute" || rule.source === "textContent" || rule.source === "dataset")) : void 0;
    normalized.push({ id, type, selector, textMatch, urlPattern, pageId, countOnce, capture });
  }
  return normalized;
}
function resolveEdgeExclusionGroups(assignments, groups, visitorId, forcedExperimentIds, stickySelections) {
  if (!groups || groups.length === 0) return assignments;
  const assignedIds = new Set(
    assignments.filter((assignment) => assignment.attributableOnly !== true).map((assignment) => assignment.experimentId)
  );
  const suppressed = /* @__PURE__ */ new Set();
  for (const group of groups) {
    if (!group?.id || !Array.isArray(group.members) || group.members.length === 0) continue;
    const epoch = Number.isFinite(group.epoch) ? Math.max(1, Math.floor(group.epoch)) : 1;
    const hasForcedAssignment = group.members.some(
      (member) => assignedIds.has(member.experimentId) && forcedExperimentIds.has(member.experimentId)
    );
    const conflicting = group.members.filter(
      (member) => assignedIds.has(member.experimentId) && !forcedExperimentIds.has(member.experimentId)
    );
    if (conflicting.length <= 1) {
      if (conflicting.length === 1 && conflicting[0].share > 0 && !hasForcedAssignment) {
        stickySelections?.set(group.id, {
          experimentId: conflicting[0].experimentId,
          epoch
        });
      }
      continue;
    }
    const configuredWeights = conflicting.map(
      (member) => Number.isFinite(member.share) && member.share > 0 ? member.share : 0
    );
    const weights = configuredWeights.some((weight) => weight > 0) ? configuredWeights : configuredWeights.map(() => 1);
    const prior = stickySelections?.get(group.id);
    const priorMember = prior ? conflicting.find((member) => member.experimentId === prior.experimentId) : void 0;
    const hasPositiveWeight = configuredWeights.some((weight) => weight > 0);
    let winnerId;
    if (prior && prior.epoch === epoch && priorMember && (priorMember.share > 0 || !hasPositiveWeight)) {
      winnerId = prior.experimentId;
    } else {
      const hashValue = hashToFloat(`${group.id}:exclusion`, visitorId);
      const index = chooseVariation(hashValue, weights);
      winnerId = conflicting[Math.max(0, Math.min(index, conflicting.length - 1))].experimentId;
    }
    if (!hasForcedAssignment) {
      stickySelections?.set(group.id, { experimentId: winnerId, epoch });
    }
    for (const member of conflicting) {
      if (member.experimentId !== winnerId) suppressed.add(member.experimentId);
    }
  }
  return suppressed.size === 0 ? assignments : assignments.filter(
    (assignment) => assignment.attributableOnly === true || !suppressed.has(assignment.experimentId)
  );
}
function evaluateEdgeAssignments(experiments, url, visitorId, exclusionGroups, stickyExclusionSelections, parsedForceMap, holdoutConfig, qaMode = false, country, now = /* @__PURE__ */ new Date()) {
  const forceMap = parsedForceMap ?? parseForceMapFromUrl(url);
  if (!qaMode && isGlobalHoldoutVisitor(holdoutConfig, visitorId)) return [];
  const assignments = [];
  for (const experiment of experiments) {
    if (!experiment?.id || !Array.isArray(experiment.variations) || experiment.variations.length === 0) {
      continue;
    }
    if (experiment.runtime_disabled === true) continue;
    const forcedVariationId = forceMap[experiment.id];
    if (!forcedVariationId) {
      if (!isExperimentServable(experiment, { qaMode, environment: "production" })) continue;
      if (weekdayScheduleBlocksDelivery2(experiment.weekdaySchedule, now)) continue;
    }
    const audienceTargetingMatches = matchesEdgeAudienceTargeting(
      experiment.targeting,
      url,
      country
    );
    const urlTargetingReproducible = !experiment.targeting || edgeUrlTargetingIsWorkerReproducible(experiment.targeting);
    const treatmentUrlMatches = matchesEdgeUrlTargeting(experiment.targeting, url);
    const treatmentTargetingMatches = audienceTargetingMatches && treatmentUrlMatches;
    const goalScopeMatches = Array.isArray(experiment.goalPageRules) && experiment.goalPageRules.filter(edgePageRuleIsUrlDriven).some((rule) => matchEdgePageRule(url, rule));
    const attributableOnly = audienceTargetingMatches && urlTargetingReproducible && !treatmentUrlMatches && goalScopeMatches;
    if (!treatmentTargetingMatches && !attributableOnly) continue;
    let variation;
    let variationIndex = -1;
    if (forcedVariationId) {
      variationIndex = experiment.variations.findIndex((v) => v.id === forcedVariationId);
      variation = variationIndex >= 0 ? experiment.variations[variationIndex] : void 0;
    } else {
      const hashValue = hashToFloat(experiment.id, visitorId);
      const allocation = experiment.trafficAllocation ?? 1;
      if (!inTrafficAllocation(hashValue, allocation)) continue;
      const variationHashValue = allocation >= 1 ? hashValue : variationHashToFloat(experiment.id, visitorId);
      const weights = experiment.variations.map((v) => v.weight ?? 0);
      const idx = chooseVariation(variationHashValue, weights);
      variation = idx >= 0 ? experiment.variations[idx] : void 0;
      variationIndex = idx;
    }
    if (!variation?.id) continue;
    const activeUrlBlock = !variation.isControl && Array.isArray(variation.urlBlocks) ? variation.urlBlocks.find(
      (block) => Array.isArray(block?.urlRules) && matchUrlRules(url, block.urlRules)
    ) : void 0;
    const seenPageIds = /* @__PURE__ */ new Set();
    assignments.push({
      experimentId: experiment.id,
      variationId: variation.id,
      assignmentEpoch: Number.isSafeInteger(experiment.assignmentEpoch) && (experiment.assignmentEpoch ?? 0) > 0 ? experiment.assignmentEpoch : void 0,
      index: variationIndex >= 0 ? variationIndex : 0,
      activePageIds: [
        ...Array.isArray(experiment.targeting?.pageRules) ? experiment.targeting.pageRules : [],
        ...Array.isArray(experiment.goalPageRules) ? experiment.goalPageRules.filter(edgePageRuleIsUrlDriven) : []
      ].filter((rule) => {
        if (!rule.id || !matchEdgePageRule(url, rule) || seenPageIds.has(rule.id)) {
          return false;
        }
        seenPageIds.add(rule.id);
        return true;
      }).map((rule) => rule.id).filter((id) => typeof id === "string"),
      attributableOnly: attributableOnly || void 0,
      experimentType: experiment.experimentType === "redirect" ? "redirect" : "mutation",
      serverSideRedirectEligible: attributableOnly ? void 0 : experiment.serverSideRedirectEligible,
      redirectUrl: !attributableOnly && typeof variation.redirectUrl === "string" ? variation.redirectUrl : void 0,
      mutations: attributableOnly ? [] : activeUrlBlock ? Array.isArray(activeUrlBlock.mutations) ? activeUrlBlock.mutations : [] : Array.isArray(variation.mutations) ? variation.mutations : [],
      goals: normalizeEdgeGoals(experiment.goals)
    });
  }
  return resolveEdgeExclusionGroups(
    assignments,
    exclusionGroups,
    visitorId,
    new Set(Object.keys(forceMap)),
    stickyExclusionSelections
  );
}
function hasValidEdgeForce(experiments, forceMap) {
  return Object.entries(forceMap).some(
    ([experimentId, variationId]) => experiments.some(
      (experiment) => experiment.id === experimentId && experiment.variations.some((variation) => variation.id === variationId)
    )
  );
}
function parseHoldoutConfigEpoch(value) {
  if (typeof value !== "string") return void 0;
  const epoch = Date.parse(value);
  return Number.isSafeInteger(epoch) && epoch > 0 ? epoch : void 0;
}
function isGlobalHoldoutVisitor(config, visitorId) {
  const pct = config?.holdout_pct;
  return config?.holdout_v1_enabled === true && typeof pct === "number" && pct > 0 && pct <= 10 && hashToFloat("apex:global-holdout:v1", visitorId) < pct / 100;
}
function filterMutationAssignments(assignments) {
  return assignments.filter(
    (assignment) => assignment.experimentType !== "redirect" && assignment.attributableOnly !== true
  );
}
function mergeInlineStyle(existing, styles) {
  const normalizeCssProp = (name) => {
    if (!name) return name;
    if (name.startsWith("--")) return name;
    if (name.includes("-")) return name;
    let out = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    if (out.startsWith("ms-")) out = "-" + out;
    return out;
  };
  const declarations = Object.entries(styles).filter(([key, value]) => key && typeof value === "string" && isSafeCssValue(value)).map(([key, value]) => normalizeCssProp(key) + ":" + value).join(";");
  if (!declarations) return existing ?? "";
  if (!existing || !existing.trim()) return declarations;
  return existing.trim().replace(/;?$/, ";") + declarations;
}
function decodeHtmlEntities(input) {
  const decodedNumeric = input.replace(
    /&#(?:x([0-9a-f]+)|(\d+));?/gi,
    (match, hexValue, decimalValue) => {
      const codePoint = Number.parseInt(hexValue ?? decimalValue ?? "", hexValue ? 16 : 10);
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    }
  );
  const namedEntities = {
    colon: ":",
    tab: "	",
    newline: "\n",
    sol: "/",
    lpar: "(",
    rpar: ")"
  };
  const decodedNamed = decodedNumeric.replace(
    /&(colon|tab|newline|sol|lpar|rpar);/gi,
    (_match, name) => namedEntities[name.toLowerCase()]
  );
  return decodedNamed;
}
function hasDangerousScheme(rawValue) {
  const normalizedValue = decodeHtmlEntities(rawValue).replace(/[\u0000-\u0020]+/g, "").toLowerCase();
  return normalizedValue.startsWith("javascript:") || normalizedValue.startsWith("vbscript:");
}
var HTML_SANITIZER_SENTINEL = "\0";
var HTML_SANITIZER_PLACEHOLDER = /\x00V(\d+)\x00/g;
var HTML_SANITIZER_URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
var HTML_SANITIZER_OPENING_TAG = /<[a-zA-Z][a-zA-Z0-9:-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g;
function sanitizeOpeningTag(tag) {
  const originalValues = [];
  const mask = (value) => {
    const index = originalValues.length;
    originalValues.push(value);
    return `${HTML_SANITIZER_SENTINEL}V${index}${HTML_SANITIZER_SENTINEL}`;
  };
  const resolvePlaceholders = (masked) => masked.replace(HTML_SANITIZER_PLACEHOLDER, (whole, index) => {
    const original = originalValues[Number(index)];
    return original ?? whole;
  });
  const maskedTag = tag.replace(
    /=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    (whole, doubleQuoted, singleQuoted, unquoted) => {
      if (doubleQuoted !== void 0) return `="${mask(doubleQuoted)}"`;
      if (singleQuoted !== void 0) return `='${mask(singleQuoted)}'`;
      const rawValue = unquoted ?? "";
      if (HTML_SANITIZER_URL_SCHEME.test(rawValue)) return `=${mask(rawValue)}`;
      const boundary = rawValue.indexOf("/");
      if (boundary === -1) return `=${mask(rawValue)}`;
      return `=${mask(rawValue.slice(0, boundary))}${rawValue.slice(boundary)}`;
    }
  );
  const strippedTag = maskedTag.replace(/[\s/]+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/[\s/]+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(
    /[\s/]+(href|src|action|formaction|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (attribute, _name, doubleQuoted, singleQuoted, unquoted) => {
      const maskedValue = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
      const originalValue = resolvePlaceholders(maskedValue);
      return hasDangerousScheme(originalValue) ? "" : attribute;
    }
  );
  return resolvePlaceholders(strippedTag);
}
function sanitizeHtmlFragment(html) {
  const withoutSentinel = html.split(HTML_SANITIZER_SENTINEL).join("");
  const withoutScripts = withoutSentinel.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  return withoutScripts.replace(HTML_SANITIZER_OPENING_TAG, (tag) => sanitizeOpeningTag(tag));
}
function isSafeCssValue(value) {
  const decodedValue = decodeHtmlEntities(value);
  const normalized = decodedValue.replace(/[\u0000-\u001f\s]+/g, "").toLowerCase();
  return !hasDangerousScheme(decodedValue) && !normalized.includes("javascript:") && !normalized.includes("vbscript:") && !normalized.includes("expression(");
}
function isSafeMutationAttribute(name, value) {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return false;
  if (value == null) return true;
  if (normalizedName.startsWith("on") || normalizedName === "srcdoc") return false;
  if (normalizedName === "style") return isSafeCssValue(value);
  if (["href", "src", "action", "formaction", "xlink:href"].includes(normalizedName)) {
    return !hasDangerousScheme(value);
  }
  return true;
}
function applyMutationToRewriter(rewriter, mutation) {
  const selector = typeof mutation.selector === "string" ? mutation.selector : "";
  if (!selector) return;
  switch (mutation.action) {
    case "html":
      rewriter.on(selector, {
        element(element) {
          if (typeof mutation.html === "string") {
            element.setInnerContent(sanitizeHtmlFragment(mutation.html), { html: true });
          }
        }
      });
      return;
    case "text":
    case "setText":
      rewriter.on(selector, {
        element(element) {
          if (typeof mutation.text === "string") {
            element.setInnerContent(mutation.text, { html: false });
          }
        }
      });
      return;
    case "attribute":
      rewriter.on(selector, {
        element(element) {
          if (mutation.attribute && typeof mutation.attribute.name === "string") {
            if (!isSafeMutationAttribute(mutation.attribute.name, mutation.attribute.value ?? null)) return;
            if (mutation.attribute.value === null) {
              element.removeAttribute(mutation.attribute.name);
            } else if (typeof mutation.attribute.value === "string") {
              element.setAttribute(mutation.attribute.name, mutation.attribute.value);
            }
          }
          if (mutation.attributes && typeof mutation.attributes === "object") {
            for (const [name, value] of Object.entries(mutation.attributes)) {
              if (!name) continue;
              if (!isSafeMutationAttribute(name, value)) continue;
              if (value === null) element.removeAttribute(name);
              else element.setAttribute(name, value);
            }
          }
        }
      });
      return;
    case "style":
    case "setStyle":
      rewriter.on(selector, {
        element(element) {
          if (!mutation.styles || typeof mutation.styles !== "object") return;
          const next = mergeInlineStyle(element.getAttribute("style"), mutation.styles);
          if (next) element.setAttribute("style", next);
        }
      });
      return;
    case "remove":
      rewriter.on(selector, {
        element(element) {
          element.remove();
        }
      });
      return;
    case "insertBefore":
    case "insertAfter":
      return;
    default:
      return;
  }
}
function shouldRewriteHtmlRequest(request) {
  if (request.method !== "GET") return false;
  const edgeMode = request.headers.get("x-drip-edge-mode");
  if (edgeMode && edgeMode.toLowerCase() === "off") return false;
  const accept = (request.headers.get("accept") ?? "").toLowerCase();
  if (accept && !accept.includes("text/html")) return false;
  const pathname = new URL(request.url).pathname.toLowerCase();
  if (pathname === "/") return true;
  if (!pathname.includes(".")) return true;
  return /\.(html?|php|asp|aspx)$/.test(pathname);
}
function mergeCookieHeaders(existing, override) {
  const normalizedOverride = override?.trim();
  if (!normalizedOverride) return existing;
  const overrideNames = new Set(parseCookieNames(normalizedOverride));
  const filteredExisting = (existing ?? "").split(";").map((part) => part.trim()).filter(Boolean).filter((part) => !overrideNames.has(part.split("=")[0]?.trim() || ""));
  return [...filteredExisting, normalizedOverride].join("; ");
}
function sanitizeUpstreamRequestHeaders(request, upstreamUrl, upstreamCookie) {
  const headers = new Headers(request.headers);
  headers.delete("x-drip-shop");
  headers.delete("x-drip-origin");
  headers.delete("x-drip-public-url");
  headers.delete("x-drip-precompile-secret");
  headers.delete("x-drip-edge-html-cache");
  headers.delete("x-drip-runtime-mode");
  headers.delete("x-drip-csp-nonce");
  headers.delete(EDGE_SOURCE_HEADER);
  headers.delete("content-length");
  if (upstreamUrl) {
    const upstreamHost = upstreamUrl.hostname;
    headers.set("host", upstreamHost);
    headers.set("x-forwarded-host", upstreamHost);
    const originHeader = headers.get("origin");
    if (originHeader) {
      headers.set("origin", upstreamUrl.origin);
    }
  }
  const mergedCookie = mergeCookieHeaders(headers.get("cookie"), upstreamCookie);
  if (mergedCookie) {
    headers.set("cookie", mergedCookie);
  } else {
    headers.delete("cookie");
  }
  return headers;
}
function buildUpstreamUrl(requestUrl, originOverrideRaw) {
  const originOverride = new URL(originOverrideRaw);
  if (!/^https?:$/i.test(originOverride.protocol)) {
    throw new Error("x-drip-origin must be http or https");
  }
  return new URL(requestUrl.pathname + requestUrl.search, originOverride.origin);
}
function flattenMutations(assignments) {
  const out = [];
  for (const assignment of assignments) {
    for (const mutation of assignment.mutations) {
      if (!mutation || typeof mutation !== "object") continue;
      out.push(mutation);
    }
  }
  return out;
}
function buildAssignmentSignature(assignments) {
  if (!assignments.length) return "none";
  const parts = assignments.map((item) => item.experimentId + ":" + item.variationId).sort().join("|");
  return murmurhash3_32_gc(parts, 11).toString(16);
}
function parseCookieNames(cookieHeader) {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((item) => item.split("=")[0]?.trim()).filter((name) => Boolean(name));
}
function hasOnlyDripCookies(cookieHeader) {
  const names = parseCookieNames(cookieHeader);
  if (!names.length) return true;
  return names.every(
    (name) => name === DRIP_UID_COOKIE || name === DRIP_EXCLUSION_GROUP_COOKIE || name === DRIP_REDIRECT_LOOP_COOKIE || name === DRIP_REDIRECT_ATTR_COOKIE
  );
}
function buildEdgeHtmlCacheKey(request, shopId, originOverride, assignmentSignature, runtimeEnabled, cohort, holdoutConfigEpoch, publicationRevision) {
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set("__drip_shop", shopId);
  cacheUrl.searchParams.set("__drip_assign", assignmentSignature);
  cacheUrl.searchParams.set("__drip_origin", murmurhash3_32_gc(originOverride, 13).toString(16));
  cacheUrl.searchParams.set("__drip_runtime", runtimeEnabled ? "1" : "0");
  if (cohort) {
    cacheUrl.searchParams.set("__drip_cohort", cohort);
    if (holdoutConfigEpoch !== void 0) {
      cacheUrl.searchParams.set("__drip_holdout_epoch", String(holdoutConfigEpoch));
    }
  }
  if (publicationRevision !== void 0) {
    cacheUrl.searchParams.set("__drip_publication_revision", String(publicationRevision));
  }
  return new Request(cacheUrl.toString(), { method: "GET" });
}
async function warmEdgeHtmlCache(cacheKey, response, ttlSeconds, ctx) {
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  headers.set("Cache-Control", "public, max-age=" + ttlSeconds + ", s-maxage=" + ttlSeconds);
  const cacheable = new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
  const cache = caches.default;
  if (ctx?.waitUntil) {
    ctx.waitUntil(cache.put(cacheKey, cacheable));
    return;
  }
  await cache.put(cacheKey, cacheable);
}
function escapeInlineScript(script) {
  return script.replace(/<\/script/gi, "<\\/script");
}
function appendEdgeRuntimeScript(rewriter, runtimeScript, cspNonce) {
  if (!runtimeScript) return;
  const open = cspNonce ? `<script nonce="${cspNonce}">` : "<script>";
  const tag = open + escapeInlineScript(runtimeScript) + "<\/script>";
  const state = { inserted: false };
  rewriter.on("head", {
    element(element) {
      if (state.inserted) return;
      element.append(tag, { html: true });
      state.inserted = true;
    }
  });
  rewriter.on("body", {
    element(element) {
      if (state.inserted) return;
      element.prepend(tag, { html: true });
      state.inserted = true;
    }
  });
}
var EDGE_BASELINE_QUERY_PARAM = "drip_b";
function resolveEdgeBaselineRequestUrl(input) {
  const url = new URL(input.toString());
  const baselineRequested = url.searchParams.getAll(EDGE_BASELINE_QUERY_PARAM).includes("1");
  if (baselineRequested) {
    const kept = url.search.replace(/^\?/, "").split("&").filter((pair) => {
      if (!pair) return false;
      const name = pair.split("=", 1)[0];
      return decodeURIComponent(name) !== EDGE_BASELINE_QUERY_PARAM;
    });
    url.search = kept.length ? `?${kept.join("&")}` : "";
  }
  return { baselineRequested, url };
}
function buildEdgeRuntimeScript(assignments, eventsEndpoint, ingestShopId, ingestSignature, observability, strictConsentMode = false, cohort, initialVisitorId, qaMode = false, holdoutConfigEpoch) {
  const payload = assignments.map((assignment) => ({
    experimentId: assignment.experimentId,
    variationId: assignment.variationId,
    assignmentEpoch: assignment.assignmentEpoch,
    index: assignment.index,
    activePageIds: assignment.activePageIds ?? [],
    attributableOnly: assignment.attributableOnly === true,
    goals: assignment.goals.filter((goal) => goal.id && (goal.type === "click" || goal.type === "pageview")).map((goal) => ({
      id: goal.id,
      type: goal.type,
      selector: typeof goal.selector === "string" ? goal.selector : void 0,
      textMatch: typeof goal.textMatch === "string" ? goal.textMatch : void 0,
      urlPattern: typeof goal.urlPattern === "string" ? goal.urlPattern : void 0,
      pageId: typeof goal.pageId === "string" ? goal.pageId : void 0,
      countOnce: Boolean(goal.countOnce),
      capture: Array.isArray(goal.capture) ? goal.capture.filter((rule) => rule.property && (rule.source === "attribute" || rule.source === "textContent" || rule.source === "dataset")).map((rule) => ({
        property: rule.property,
        source: rule.source,
        attribute: rule.attribute
      })) : void 0
    }))
  }));
  const edgeSource = observability?.edgeSource ?? "unknown";
  const assignmentReadyMs = observability?.assignmentReadyMs ?? 0;
  const edgeAssignmentPayload = payload.filter((assignment) => assignment.attributableOnly !== true).map((assignment) => ({
    experimentId: assignment.experimentId,
    variationId: assignment.variationId,
    index: assignment.index
  }));
  return "(function(){if(window.__dripEdgeInit)return;window.__dripEdgeInit=true;window.__dripEdgeAssignments=" + JSON.stringify(edgeAssignmentPayload) + ";var A=" + JSON.stringify(payload) + ";var CO=" + JSON.stringify(cohort ?? "") + ";var HCE=" + JSON.stringify(holdoutConfigEpoch) + ";var E=" + JSON.stringify(eventsEndpoint) + ";var SH=" + JSON.stringify(ingestShopId) + ";var SG=" + JSON.stringify(ingestSignature) + ";var CM=" + JSON.stringify(strictConsentMode) + ";var QM=" + JSON.stringify(qaMode) + ";var _OBS={edge_source:" + JSON.stringify(edgeSource) + ",assignment_ready_ms:" + assignmentReadyMs + "};function sid(){try{var k='drip_sid';var v=sessionStorage.getItem(k);if(v)return v;v=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem(k,v);return v;}catch(e){return Math.random().toString(36).slice(2)+Date.now().toString(36);}}function uid(){try{var m=document.cookie.match(/(?:^|;\\s*)drip_uid=([^;]+)/);if(m&&m[1])return decodeURIComponent(m[1]);}catch(e){}return Math.random().toString(36).slice(2)+Date.now().toString(36);}function eid(){try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();if(window.crypto&&window.crypto.getRandomValues){var b=new Uint8Array(16);window.crypto.getRandomValues(b);var h='';for(var i=0;i<b.length;i++)h+=b[i].toString(16).padStart(2,'0');return h;}}catch(e){}return Date.now().toString(36)+Math.random().toString(36).slice(2);}function hasConsent(){if(window.__dripHasConsent===true)return true;if(window.__dripHasConsent===false)return false;try{if(/(?:^|;\\s*)drip_consent=1(?:;|$)/.test(document.cookie||''))return true;}catch(e){}if(window.__dripRequireConsent===true)return false;if(!CM)return true;return false;}var SID='';var UID=" + JSON.stringify(initialVisitorId ?? "") + ";var Q=[];var started=false;var clickBound=false;var timer=0;var shopifySynced=false;var shopifySyncDeadline=0;var shopifySyncAttempt=0;var shopifySyncTimer=0;function ensureIds(){if(!hasConsent())return false;if(!SID)SID=sid();if(!UID)UID=uid();return true;}function persistUid(){if(!UID||!hasConsent())return;try{document.cookie='drip_uid='+encodeURIComponent(UID)+'; Max-Age=31536000; Path=/; SameSite=Lax';}catch(e){}}function syncShopify(){if(shopifySynced||!hasConsent())return;if(!shopifySyncDeadline)shopifySyncDeadline=Date.now()+10000;try{var publish=window.Shopify&&window.Shopify.analytics&&window.Shopify.analytics.publish;if(typeof publish==='function'){publish('drip_assignment_sync',{visitorId:UID,sessionId:SID,qaMode:QM,qaSessionId:'',cohort:CO||undefined,holdoutConfigEpoch:HCE,assignments:A.filter(function(a){return a.attributableOnly!==true;}).map(function(a){return{experimentId:a.experimentId,variationId:a.variationId,assignmentEpoch:a.assignmentEpoch};})});shopifySynced=true;return;}}catch(e){}var remaining=shopifySyncDeadline-Date.now();if(remaining<=0)return;var delay=Math.min(1000,100*Math.pow(2,shopifySyncAttempt++),remaining);shopifySyncTimer=window.setTimeout(syncShopify,delay);}function sys(s,d){var o={};for(var k in s)o[k]=s[k];if(d){for(var k2 in d)o[k2]=d[k2];}for(var k3 in s)o[k3]=s[k3];return o;}function push(t,d,experimentId,vid,eventId){if(!ensureIds())return;d=sys(CO?{cohort:CO,holdout_config_epoch:HCE}:{},d);Q.push({type:t,data:d,experimentId:experimentId,variationId:vid,event_id:eventId,qa_mode:QM,shopId:SH,visitorId:UID,sessionId:SID,url:location.href,ts:Date.now()});if(Q.length>=20)flush();}function flush(){if(!ensureIds()||!Q.length)return;var batch=Q.splice(0,Q.length);fetch(E,{method:'POST',headers:{'Content-Type':'application/json','X-Drip-Shop':SH,'X-Drip-Signature':SG},body:JSON.stringify({events:batch}),keepalive:true}).catch(function(){});}function gk(gid,vid){return 'drip_goal:'+gid+':'+vid;}function fired(gid,vid){try{return localStorage.getItem(gk(gid,vid))==='1';}catch(e){return false;}}function mark(gid,vid){try{localStorage.setItem(gk(gid,vid),'1');}catch(e){}}function cap(el,arr){var out={};if(!arr||!arr.length)return out;for(var i=0;i<arr.length;i++){var r=arr[i];if(!r||!r.property)continue;if(r.source==='attribute'&&r.attribute){out[r.property]=el.getAttribute(r.attribute);}else if(r.source==='textContent'){out[r.property]=(el.textContent||'').trim().slice(0,500);}else if(r.source==='dataset'&&r.attribute){var key=r.attribute.replace(/^data-/,'').replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});out[r.property]=(el.dataset&&el.dataset[key])||null;}}return out;}function goalActive(g,a){if(g.pageId)return Array.isArray(a.activePageIds)&&a.activePageIds.indexOf(g.pageId)>=0;if(!g.urlPattern)return true;try{return new RegExp(g.urlPattern).test(location.href);}catch(e){return false;}}function fire(goal,a,data){if(!ensureIds()||!goal||!goal.id||!goalActive(goal,a))return;if(goal.countOnce){if(fired(goal.id,a.variationId))return;mark(goal.id,a.variationId);}var payload=sys({goalId:goal.id},data);push('goal',payload,a.experimentId,a.variationId);}function runPageviewGoals(){for(var i=0;i<A.length;i++){var a=A[i];for(var j=0;j<a.goals.length;j++){var g=a.goals[j];if(g.type==='pageview')fire(g,a);}}}function txtM(el,txt){return(el.textContent||'').trim().toLowerCase().indexOf(txt.trim().toLowerCase())>=0;}function findTxt(el,txt){var n=txt.trim().toLowerCase();while(el&&el!==document.documentElement){if((el.textContent||'').trim().toLowerCase().indexOf(n)>=0)return el;el=el.parentElement;}return null;}function bindClickGoals(){if(clickBound)return;clickBound=true;document.addEventListener('click',function(ev){var t=ev.target;if(!t||!t.closest)return;for(var i=0;i<A.length;i++){var a=A[i];for(var j=0;j<a.goals.length;j++){var g=a.goals[j];if(g.type!=='click')continue;var s=g.selector,tm=g.textMatch;if(!s&&!tm)continue;var m=null;if(s){m=t.closest(s);if(!m)continue;if(tm&&!txtM(m,tm))continue;}else if(tm){m=findTxt(t,tm);if(!m)continue;}if(m)fire(g,a,cap(m,g.capture));}}},true);}function start(){if(started||!ensureIds())return;started=true;syncShopify();if(CO)push('pageview',{});for(var i=0;i<A.length;i++){var a=A[i];if(!a.attributableOnly)push('experiment_viewed',{index:a.index},a.experimentId,a.variationId);}runPageviewGoals();bindClickGoals();timer=window.setInterval(flush,5000);window.setTimeout(flush,120);try{var bsMs=0;if(window.performance&&performance.timing){bsMs=Math.max(0,performance.timing.domContentLoadedEventStart-performance.timing.navigationStart);}var cacheSrc=document.querySelector('[data-drip-cache]')?document.querySelector('[data-drip-cache]').getAttribute('data-drip-cache'):'none';var perfPayload={perf_event_kind:'init',blank_screen_ms:bsMs,assignment_ready_ms:_OBS.assignment_ready_ms,platform:'auto',config_source:_OBS.edge_source,activation_mode:'observer',cache_hit_source:cacheSrc};push('sdk_perf',perfPayload);push('edge_perf',{blank_screen_ms:bsMs,assignment_ready_ms:_OBS.assignment_ready_ms,edge_source:_OBS.edge_source,cache_hit_source:cacheSrc});}catch(e){}}window.addEventListener('pagehide',flush);window.addEventListener('beforeunload',flush);var req=(CM||window.__dripRequireConsent===true||typeof window.__dripHasConsent==='boolean');var consent=hasConsent();function consentCookie(granted){try{document.cookie=granted?'drip_consent=1; Max-Age=31536000; Path=/; SameSite=Lax':'drip_consent=; Max-Age=0; Path=/; SameSite=Lax';}catch(e){}}var prevSet=window.dripSetConsent;window.dripSetConsent=function(granted){window.__dripHasConsent=(granted===true);consentCookie(window.__dripHasConsent);if(typeof prevSet==='function'){try{prevSet(granted);}catch(e){}}if(window.__dripHasConsent){ensureIds();persistUid();start();}else{started=false;Q=[];if(timer){clearInterval(timer);timer=0;}if(shopifySyncTimer){clearTimeout(shopifySyncTimer);shopifySyncTimer=0;}shopifySyncDeadline=0;shopifySyncAttempt=0;}};window.Drip=window.Drip||{};if(typeof window.Drip.flush!=='function'){window.Drip.flush=flush;}if(typeof window.Drip.setConsent!=='function'){window.Drip.setConsent=function(granted){window.dripSetConsent(granted);};}if(typeof window.Drip.trackGoal!=='function'){window.Drip.trackGoal=function(goalId,data){for(var i=0;i<A.length;i++){var a=A[i];for(var j=0;j<a.goals.length;j++){var g=a.goals[j];if(g.id===goalId)fire(g,a,data||{});}}};}if(typeof window.Drip.trackRevenue!=='function'){window.Drip.trackRevenue=function(revenue,data){var p=sys({goalId:'__revenue__',revenue:revenue},data);if(data&&'currency' in data){var currency=typeof data.currency==='string'?data.currency.trim().toUpperCase():'';if((' " + ISO_4217_CURRENCY_CODES.join(" ") + " ').indexOf(' '+currency+' ')!==-1){p.currency=currency;}else{delete p.currency;p.currency_raw=data.currency;p.money_error='invalid_currency';}}var eventId=eid();var revenueAssignments=A.filter(function(a){return a.attributableOnly!==true;});if(CO&&!revenueAssignments.length){push('goal',p,undefined,undefined,eventId);return;}for(var i=0;i<revenueAssignments.length;i++){var a=revenueAssignments[i];push('goal',p,a.experimentId,a.variationId,eventId);}};}if(!req||consent)start();})();";
}
function resolveEdgeVisitorContext(initialVisitorId, shouldSetVisitorCookie, config, edgeConsentGranted, createVisitorId = () => randomHexId(16), qaMode = false) {
  const strictConsentPending = config.runtime?.consentMode?.enabled === true && !edgeConsentGranted;
  const visitorId = strictConsentPending ? createVisitorId() : initialVisitorId;
  const programCohort = !qaMode && config.holdout_v1_enabled === true ? isGlobalHoldoutVisitor(config, visitorId) ? "holdout" : "active" : void 0;
  return {
    visitorId,
    shouldSetVisitorCookie: strictConsentPending ? false : shouldSetVisitorCookie,
    strictConsentPending,
    programCohort
  };
}

// src/config.ts
var DEFAULT_CONFIG_API_URL = "https://app.drip-apex.com";
var CONFIG_FETCH_TIMEOUT_MS = 800;
var CONFIG_CACHE_URL = "https://edge-config-cache.drip-apex.invalid/v1";
var CONFIG_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
var CONFIG_SOFT_TTL_SECONDS = 30;
var CONFIG_HARD_TTL_SECONDS = 300;
var CONFIG_KV_STALE_GRACE_SECONDS = 24 * 60 * 60;
var configByteLengths = /* @__PURE__ */ new WeakMap();
var inFlightRevalidations = /* @__PURE__ */ new Map();
var ConfigResponseTooLargeError = class extends Error {
  constructor() {
    super("config_too_large");
  }
};
function buildConfigUrl(shopId, configuredUrl) {
  const configured = new URL(configuredUrl?.trim() || DEFAULT_CONFIG_API_URL);
  const url = configured.pathname === "/" ? new URL("/api/exp" + configured.search, configured.origin) : new URL(configured.toString());
  url.hash = "";
  url.searchParams.set("shopId", shopId);
  return url;
}
function buildConfigCacheKey(shopId, configuredUrl) {
  const url = new URL(CONFIG_CACHE_URL);
  url.searchParams.set("shopId", shopId);
  url.searchParams.set("api", buildConfigUrl(shopId, configuredUrl).toString());
  return new Request(url.toString(), { method: "GET" });
}
function parseConfig(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const config = parsed;
    if (!Array.isArray(config.experiments)) return null;
    configByteLengths.set(config, new TextEncoder().encode(raw).byteLength);
    return config;
  } catch {
    return null;
  }
}
async function readResponseTextWithLimit(response, maxBytes) {
  if (maxBytes === void 0) return response.text();
  const contentLength = response.headers.get("Content-Length");
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      await response.body?.cancel().catch(() => void 0);
      throw new ConfigResponseTooLargeError();
    }
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("config_too_large").catch(() => void 0);
        throw new ConfigResponseTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
function getConfigByteLength(config) {
  return configByteLengths.get(config) ?? new TextEncoder().encode(JSON.stringify(config)).byteLength;
}
function extractRevision(config) {
  const value = config.publicationRevision;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
async function readCachedConfig(cache, key) {
  try {
    const cached = await cache.match(key);
    if (!cached) return null;
    return parseConfig(await cached.text());
  } catch {
    return null;
  }
}
async function readKvEntry(kv, key) {
  try {
    const rawEntry = await kv.get(key);
    if (!rawEntry) return null;
    const parsed = JSON.parse(rawEntry);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entry = parsed;
    if (typeof entry.raw !== "string" || typeof entry.storedAt !== "number") return null;
    return {
      raw: entry.raw,
      storedAt: entry.storedAt,
      revision: typeof entry.revision === "number" ? entry.revision : null
    };
  } catch {
    return null;
  }
}
async function fetchShopConfig(input) {
  const cache = input.cache ?? caches.default;
  const fetcher = input.fetcher ?? fetch;
  const now = input.now ?? Date.now;
  const kv = input.cacheMode === "off" ? null : input.kv ?? null;
  const softTtlMs = Math.max(0, input.softTtlSeconds ?? CONFIG_SOFT_TTL_SECONDS) * 1e3;
  const hardTtlSeconds = Math.max(1, input.hardTtlSeconds ?? CONFIG_HARD_TTL_SECONDS);
  const hardTtlMs = hardTtlSeconds * 1e3;
  const kvRetentionTtlSeconds = hardTtlSeconds + CONFIG_KV_STALE_GRACE_SECONDS;
  let configuredUrl = input.configuredUrl?.trim() || void 0;
  if (configuredUrl) {
    try {
      configuredUrl = new URL(configuredUrl).toString();
    } catch {
      configuredUrl = void 0;
    }
  }
  const cacheKey = buildConfigCacheKey(input.shopId, configuredUrl);
  const kvKey = cacheKey.url;
  const configUrl = buildConfigUrl(input.shopId, configuredUrl);
  const runWaitUntil = (promise) => {
    if (input.waitUntil) input.waitUntil(promise);
    else void promise.catch(() => void 0);
  };
  const fetchFromNetwork = async () => {
    const controller = new AbortController();
    const timeoutMs = Math.min(CONFIG_FETCH_TIMEOUT_MS, Math.max(1, input.timeoutMs ?? CONFIG_FETCH_TIMEOUT_MS));
    const timer = setTimeout(() => controller.abort("config_timeout"), timeoutMs);
    try {
      const response = await fetcher(configUrl, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`config_http_${response.status}`);
      const raw = await readResponseTextWithLimit(response, input.maxResponseBytes);
      const config = parseConfig(raw);
      if (!config) throw new Error("config_invalid");
      return { config, raw };
    } finally {
      clearTimeout(timer);
    }
  };
  const storeConfig = (raw, config, guardKvRevision = false) => {
    return (async () => {
      const entry = { raw, storedAt: now(), revision: extractRevision(config) };
      let isOlderRevision = false;
      if (guardKvRevision && kv) {
        const stored = await readKvEntry(kv, kvKey);
        const storedRevision = stored?.revision;
        isOlderRevision = entry.revision !== null && storedRevision !== null && storedRevision !== void 0 && entry.revision < storedRevision;
      }
      if (isOlderRevision) return;
      const writes = [];
      if (kv) {
        writes.push(
          kv.put(kvKey, JSON.stringify(entry), { expirationTtl: kvRetentionTtlSeconds }).catch(() => void 0)
        );
      }
      writes.push(
        cache.put(cacheKey, new Response(raw, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CONFIG_CACHE_TTL_SECONDS}`
          }
        })).catch(() => void 0)
      );
      return Promise.all(writes);
    })();
  };
  let kvEntry = null;
  if (kv) {
    kvEntry = await readKvEntry(kv, kvKey);
    if (kvEntry) {
      const cachedConfig = parseConfig(kvEntry.raw);
      if (cachedConfig) {
        const age = now() - kvEntry.storedAt;
        if (age <= softTtlMs) {
          return { config: cachedConfig, source: "kv-hit" };
        }
        if (age <= hardTtlMs) {
          let revalidation = inFlightRevalidations.get(kvKey);
          if (!revalidation) {
            revalidation = (async () => {
              try {
                const fresh = await fetchFromNetwork();
                await storeConfig(fresh.raw, fresh.config, true);
              } catch {
              } finally {
                inFlightRevalidations.delete(kvKey);
              }
            })();
            inFlightRevalidations.set(kvKey, revalidation);
          }
          runWaitUntil(revalidation);
          return { config: cachedConfig, source: "kv-stale-revalidate" };
        }
      } else {
        kvEntry = null;
      }
    }
  }
  try {
    const { config, raw } = await fetchFromNetwork();
    const write = storeConfig(raw, config);
    if (input.waitUntil) input.waitUntil(write);
    else await write;
    return { config, source: "network" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (kvEntry) {
      const staleConfig = parseConfig(kvEntry.raw);
      if (staleConfig) return { config: staleConfig, source: "stale", error: message };
    }
    const stale = await readCachedConfig(cache, cacheKey);
    if (stale) return { config: stale, source: "stale", error: message };
    return {
      config: null,
      source: error instanceof ConfigResponseTooLargeError ? "oversized" : "none",
      error: message
    };
  }
}

// src/gating.ts
var EVENTS_PATH = "/_drip/events";
var REPLAY_PATH = "/_drip/replay-blocks";
var STATUS_PATH = "/_drip/status";
function classifyRequest(request) {
  const pathname = new URL(request.url).pathname;
  if (pathname === EVENTS_PATH) {
    return request.method === "POST" ? "events" : "events-method-not-allowed";
  }
  if (pathname === REPLAY_PATH) {
    return request.method === "POST" ? "replay" : "events-method-not-allowed";
  }
  if (pathname === STATUS_PATH) {
    return request.method === "GET" ? "status" : "status-method-not-allowed";
  }
  return shouldRewriteHtmlRequest(request) ? "html" : "passthrough";
}

// src/version.ts
var EDGE_WORKER_VERSION = "1.1.5";
var MINIMUM_COMPATIBLE_ENGINE_VERSION_FIELD = "minimumEdgeEngineVersion";
function parseVersion(value) {
  const match = value.trim().match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
  );
  if (!match) return null;
  const parts = match.slice(1, 4).map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isSafeInteger(part))) return null;
  const prerelease = match[4] ? match[4].split(".").map((part) => /^\d+$/.test(part) ? Number.parseInt(part, 10) : part) : null;
  if (prerelease?.some((part) => typeof part === "number" && !Number.isSafeInteger(part))) {
    return null;
  }
  return {
    core: parts,
    prerelease,
    buildMetadata: match[5]?.split(".") ?? null
  };
}
function compareEngineVersions(left, right) {
  const leftVersion = parseVersion(left);
  const rightVersion = parseVersion(right);
  if (!leftVersion || !rightVersion) return null;
  for (let index = 0; index < leftVersion.core.length; index += 1) {
    if (leftVersion.core[index] < rightVersion.core[index]) return -1;
    if (leftVersion.core[index] > rightVersion.core[index]) return 1;
  }
  if (!leftVersion.prerelease && !rightVersion.prerelease) return 0;
  if (!leftVersion.prerelease) return 1;
  if (!rightVersion.prerelease) return -1;
  const identifierCount = Math.max(
    leftVersion.prerelease.length,
    rightVersion.prerelease.length
  );
  for (let index = 0; index < identifierCount; index += 1) {
    const leftIdentifier = leftVersion.prerelease[index];
    const rightIdentifier = rightVersion.prerelease[index];
    if (leftIdentifier === void 0) return -1;
    if (rightIdentifier === void 0) return 1;
    if (leftIdentifier === rightIdentifier) continue;
    if (typeof leftIdentifier === "number" && typeof rightIdentifier === "number") {
      return leftIdentifier < rightIdentifier ? -1 : 1;
    }
    if (typeof leftIdentifier === "number") return -1;
    if (typeof rightIdentifier === "number") return 1;
    return leftIdentifier < rightIdentifier ? -1 : 1;
  }
  return 0;
}
function decideVersionGuard(payload, workerVersion = EDGE_WORKER_VERSION) {
  const required = payload[MINIMUM_COMPATIBLE_ENGINE_VERSION_FIELD];
  if (required == null) return "edge";
  if (typeof required !== "string" || !required.trim()) return "sdk-only";
  const comparison = compareEngineVersions(workerVersion, required);
  return comparison !== null && comparison >= 0 ? "edge" : "sdk-only";
}

// src/rate-limit.ts
function consumeToken(buckets, key, capacity, windowMs, now) {
  const safeCapacity = Math.max(1, capacity);
  const safeWindowMs = Math.max(1, windowMs);
  const existing = buckets.get(key);
  if (!existing) {
    buckets.set(key, {
      tokens: safeCapacity - 1,
      lastRefillAt: now,
      lastSeenAt: now
    });
    return { allowed: true, retryAfterMs: 0 };
  }
  const elapsedMs = Math.max(0, now - existing.lastRefillAt);
  existing.tokens = Math.min(
    safeCapacity,
    Math.max(0, existing.tokens) + elapsedMs * safeCapacity / safeWindowMs
  );
  existing.lastRefillAt = Math.max(existing.lastRefillAt, now);
  existing.lastSeenAt = Math.max(existing.lastSeenAt, now);
  if (existing.tokens < 1) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, (1 - existing.tokens) * safeWindowMs / safeCapacity)
    };
  }
  existing.tokens -= 1;
  return { allowed: true, retryAfterMs: 0 };
}
function removeStaleBuckets(buckets, now, staleAfterMs) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeenAt >= staleAfterMs) buckets.delete(key);
  }
}

// src/rate-limiter-do.ts
var RATE_LIMIT_LANES = /* @__PURE__ */ new Set(["events", "replay", "status"]);
function parseRateLimitRequest(raw) {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw;
  if (typeof input.lane !== "string" || !RATE_LIMIT_LANES.has(input.lane)) return null;
  if (typeof input.shopId !== "string" || !input.shopId.trim()) return null;
  if (typeof input.clientIp !== "string" || !input.clientIp.trim()) return null;
  for (const key of ["windowMs", "maxPerIp", "maxPerShop"]) {
    const value = input[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  }
  return raw;
}
var ApexRateLimiterDO = class {
  buckets = /* @__PURE__ */ new Map();
  requestCount = 0;
  constructor(_state) {
  }
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
    }
    const input = parseRateLimitRequest(await request.json().catch(() => null));
    if (!input) return new Response("Bad Request", { status: 400 });
    const now = Date.now();
    const ipDecision = consumeToken(
      this.buckets,
      `${input.lane}:ip:${input.shopId}:${input.clientIp}`,
      input.maxPerIp,
      input.windowMs,
      now
    );
    const shopDecision = ipDecision.allowed ? consumeToken(
      this.buckets,
      `${input.lane}:shop:${input.shopId}`,
      input.maxPerShop,
      input.windowMs,
      now
    ) : null;
    this.requestCount += 1;
    if (this.requestCount % 100 === 0) {
      removeStaleBuckets(this.buckets, now, input.windowMs * 2);
    }
    const failingDecision = !ipDecision.allowed ? ipDecision : shopDecision;
    return Response.json(failingDecision?.allowed === false ? failingDecision : { allowed: true, retryAfterMs: 0 });
  }
};

// src/index.ts
var EVENTS_UPSTREAM_URL = "https://events.drip-apex.com/v1/events";
var REPLAY_UPSTREAM_URL = "https://events.drip-apex.com/replay-blocks";
var EDGE_HTML_CACHE_TTL_SECONDS = 15;
var DEFAULT_PROXY_RATE_LIMIT_WINDOW_MS = 6e4;
var DEFAULT_PROXY_RATE_LIMIT_MAX_PER_IP = 300;
var DEFAULT_PROXY_RATE_LIMIT_MAX_PER_SHOP = 1e4;
var DEFAULT_ORIGIN_FETCH_TIMEOUT_MS = 5e3;
var DEFAULT_MAX_MUTATION_BYTES = 256 * 1024;
var DEFAULT_MAX_CONFIG_BYTES = 2 * 1024 * 1024;
var proxyRateLimitBuckets = /* @__PURE__ */ new Map();
var proxyRateLimitRequestCount = 0;
var lastConfigSources = /* @__PURE__ */ new Map();
var lastConfigErrors = /* @__PURE__ */ new Map();
function resolveCustomerAssignmentInputs(config, requestUrl, cookieHeader, strictConsentPending) {
  const forceMap = resolveEdgeForceMap(requestUrl, cookieHeader);
  return {
    forceMap,
    qaMode: hasValidEdgeForce(config.experiments, forceMap) && isEdgeQaMode(requestUrl, cookieHeader),
    stickySelections: strictConsentPending ? void 0 : parseEdgeExclusionStickySelections(cookieHeader)
  };
}
function canUseCustomerHtmlCache(input) {
  return !input.shouldSetVisitorCookie && !input.strictConsentPending && (!input.programCohort || input.holdoutConfigEpoch !== void 0) && hasOnlyDripCookies(input.cookieHeader);
}
function withWorkerVersion(response, edgeSource, skippedCount = 0) {
  const headers = new Headers(response.headers);
  headers.set("x-drip-edge-worker", EDGE_WORKER_VERSION);
  if (edgeSource) headers.set("x-drip-edge", edgeSource);
  if (skippedCount > 0) headers.set("x-drip-edge-skipped", String(skippedCount));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function mergeVaryCookie(headers) {
  const vary = (headers.get("Vary") ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  if (!vary.some((part) => part.toLowerCase() === "cookie")) vary.push("Cookie");
  headers.set("Vary", vary.join(", "));
}
function upstreamRequest(request, env, targetUrl) {
  const upstreamUrl = buildUpstreamUrl(targetUrl, env.ORIGIN_URL);
  const headers = sanitizeUpstreamRequestHeaders(request, upstreamUrl);
  headers.set("Host", upstreamUrl.host);
  headers.set("X-Forwarded-Host", upstreamUrl.host);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init = {
    method: request.method,
    headers,
    redirect: "manual",
    body: hasBody ? request.body : void 0
  };
  if (hasBody) init.duplex = "half";
  return new Request(upstreamUrl.toString(), init);
}
async function fetchOrigin(request, env, targetUrl = new URL(request.url), options = {}) {
  const timeoutMs = parseRateLimitValue(
    env.ORIGIN_FETCH_TIMEOUT_MS,
    DEFAULT_ORIGIN_FETCH_TIMEOUT_MS,
    1,
    3e4
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new DOMException("Origin fetch timed out", "TimeoutError"));
  }, timeoutMs);
  const timeoutSignal = options.timeoutSignal ? AbortSignal.any([controller.signal, options.timeoutSignal]) : controller.signal;
  let response;
  try {
    response = await (options.fetcher ?? fetch)(upstreamRequest(request, env, targetUrl), {
      signal: timeoutSignal
    });
  } catch (error) {
    if (!timeoutSignal.aborted && error?.name !== "AbortError" && error?.name !== "TimeoutError") {
      throw error;
    }
    return new Response("Origin fetch timed out", {
      status: 504,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
  const location = response.headers.get("Location");
  if (!location || response.status < 300 || response.status >= 400) return response;
  try {
    const redirectUrl = new URL(location);
    const originUrl = new URL(env.ORIGIN_URL);
    if (redirectUrl.host !== originUrl.host) return response;
    const storefrontUrl = new URL(request.url);
    const headers = new Headers(response.headers);
    headers.set(
      "Location",
      storefrontUrl.origin + redirectUrl.pathname + redirectUrl.search + redirectUrl.hash
    );
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch {
    return response;
  }
}
function parseRateLimitValue(raw, fallback, minimum, maximum) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}
async function checkProxyRateLimit(request, env, lane) {
  const windowMs = parseRateLimitValue(
    env.RATE_LIMIT_WINDOW_MS,
    DEFAULT_PROXY_RATE_LIMIT_WINDOW_MS,
    1e3,
    60 * 60 * 1e3
  );
  const maxPerIp = parseRateLimitValue(
    env.RATE_LIMIT_MAX_PROXY_REQUESTS_PER_IP,
    DEFAULT_PROXY_RATE_LIMIT_MAX_PER_IP,
    1,
    1e5
  );
  const maxPerShop = parseRateLimitValue(
    env.RATE_LIMIT_MAX_PROXY_REQUESTS_PER_SHOP,
    DEFAULT_PROXY_RATE_LIMIT_MAX_PER_SHOP,
    1,
    1e6
  );
  const now = Date.now();
  const clientIp = request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
  let decision;
  if (env.RATE_LIMIT_DO) {
    try {
      const stub = env.RATE_LIMIT_DO.get(env.RATE_LIMIT_DO.idFromName(env.SHOP_ID));
      const timeoutSignal = AbortSignal.timeout(1e3);
      let timeout;
      const timeoutPromise = new Promise((_resolve, reject) => {
        timeout = setTimeout(() => reject(timeoutSignal.reason ?? new Error("Rate limiter timed out")), 1e3);
      });
      const fetchPromise = stub.fetch("https://rate-limit.internal/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lane, shopId: env.SHOP_ID, clientIp, windowMs, maxPerIp, maxPerShop }),
        signal: timeoutSignal
      });
      fetchPromise.catch(() => void 0);
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]).finally(() => {
        if (timeout !== void 0) clearTimeout(timeout);
      });
      if (!response.ok) throw new Error(`Rate limiter returned ${response.status}`);
      const payload = await response.json();
      if (typeof payload.allowed !== "boolean" || typeof payload.retryAfterMs !== "number" || !Number.isFinite(payload.retryAfterMs) || payload.retryAfterMs < 0) {
        throw new Error("Invalid rate limiter response");
      }
      decision = { allowed: payload.allowed, retryAfterMs: payload.retryAfterMs };
    } catch {
      decision = checkLocalProxyRateLimit(lane, env.SHOP_ID, clientIp, windowMs, maxPerIp, maxPerShop, Date.now());
    }
  } else {
    decision = checkLocalProxyRateLimit(lane, env.SHOP_ID, clientIp, windowMs, maxPerIp, maxPerShop, now);
  }
  if (decision.allowed) return null;
  return withWorkerVersion(new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.max(1, Math.ceil(decision.retryAfterMs / 1e3)))
    }
  }), `${lane}-proxy-rate-limited`);
}
function checkLocalProxyRateLimit(lane, shopId, clientIp, windowMs, maxPerIp, maxPerShop, now) {
  const ipDecision = consumeToken(proxyRateLimitBuckets, `${lane}:ip:${shopId}:${clientIp}`, maxPerIp, windowMs, now);
  const shopDecision = ipDecision.allowed ? consumeToken(proxyRateLimitBuckets, `${lane}:shop:${shopId}`, maxPerShop, windowMs, now) : null;
  proxyRateLimitRequestCount += 1;
  if (proxyRateLimitRequestCount % 100 === 0) {
    removeStaleBuckets(proxyRateLimitBuckets, now, windowMs * 2);
  }
  return !ipDecision.allowed ? ipDecision : shopDecision ?? ipDecision;
}
async function proxyEvents(request, env, upstreamUrl = EVENTS_UPSTREAM_URL) {
  const lane = upstreamUrl === REPLAY_UPSTREAM_URL ? "replay" : "events";
  const rateLimited = await checkProxyRateLimit(request, env, lane);
  if (rateLimited) return rateLimited;
  const headers = new Headers({
    "Content-Type": request.headers.get("Content-Type") ?? "application/json",
    "X-Drip-Shop": env.SHOP_ID,
    "X-Drip-Signature": env.APEX_INGEST_TOKEN
  });
  let response;
  try {
    response = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: request.body,
      duplex: "half",
      redirect: "manual"
    });
  } catch {
    return withWorkerVersion(
      new Response("Bad Gateway", { status: 502 }),
      `${lane}-proxy`
    );
  }
  if (response.status >= 300 && response.status < 400) {
    return withWorkerVersion(new Response("Bad Gateway", { status: 502 }), "events-proxy");
  }
  return withWorkerVersion(response, "events-proxy");
}
function appendClientSdkWhenMissing(rewriter, shopId, useEventProxy, scriptUrl) {
  const proxyAttributes = useEventProxy ? ` data-apex-events-endpoint="${EVENTS_PATH}" data-apex-server-signed-events="1"` : "";
  appendSdkWhenMissing(rewriter, {
    shopId,
    scriptUrl,
    buildInjectedTag: (encodedShopId) => `<script src="${escapeHtmlAttribute(resolveSdkScriptUrl(shopId, scriptUrl))}" data-apex-install-surface="customer_edge_worker"${proxyAttributes}><\/script>`,
    onFound: useEventProxy ? (element) => {
      element.setAttribute("data-apex-events-endpoint", EVENTS_PATH);
      element.setAttribute("data-apex-server-signed-events", "1");
    } : void 0
  });
}
function isHtmlResponse(response) {
  return (response.headers.get("Content-Type") ?? "").toLowerCase().includes("text/html");
}
async function sdkOnlyResponse(request, env, targetUrl, skippedCount = 0, scriptUrl) {
  const origin = await fetchOrigin(request, env, targetUrl);
  if (!isHtmlResponse(origin)) {
    return withWorkerVersion(origin, "sdk-only-passthrough", skippedCount);
  }
  const rewriter = new HTMLRewriter();
  appendClientSdkWhenMissing(rewriter, env.SHOP_ID, Boolean(env.APEX_INGEST_TOKEN?.trim()), scriptUrl);
  return withWorkerVersion(rewriter.transform(origin), "sdk-only", skippedCount);
}
function buildCustomerHtmlCacheKey(requestUrl, env, assignments, runtimeEnabled, cohort, holdoutConfigEpoch, publicationRevision) {
  const cacheUrl = requestUrl instanceof Request ? requestUrl.url : requestUrl;
  const key = buildEdgeHtmlCacheKey(
    new Request(resolveEdgeBaselineRequestUrl(cacheUrl).url.toString()),
    env.SHOP_ID,
    env.ORIGIN_URL,
    buildAssignmentSignature(assignments),
    runtimeEnabled,
    cohort,
    holdoutConfigEpoch,
    publicationRevision
  );
  if (publicationRevision === void 0) return key;
  const url = new URL(key.url);
  url.searchParams.set("__drip_publication_revision", String(publicationRevision));
  return new Request(url.toString(), { method: "GET" });
}
function getMutationByteLength(mutation) {
  try {
    return new TextEncoder().encode(JSON.stringify(mutation)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
function resolveConfigApiUrl(env) {
  try {
    return buildConfigUrl(env.SHOP_ID, env.CONFIG_API_URL).toString();
  } catch {
    return buildConfigUrl(env.SHOP_ID).toString();
  }
}
function sanitizeStatusUrl(raw, keepShopId = false) {
  try {
    const url = new URL(raw);
    const shopId = keepShopId ? url.searchParams.get("shopId") : null;
    url.username = "";
    url.password = "";
    url.hash = "";
    url.search = "";
    if (shopId) url.searchParams.set("shopId", shopId);
    if (!keepShopId) return url.origin;
    return url.toString();
  } catch {
    return "invalid";
  }
}
function isValidHttpUrl(raw) {
  if (!raw?.trim()) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
async function handleStatusRequest(request, env) {
  const rateLimited = await checkProxyRateLimit(request, env, "status");
  if (rateLimited) return rateLimited;
  const ingestTokenSet = Boolean(env.APEX_INGEST_TOKEN?.trim());
  const problems = [];
  if (!env.SHOP_ID?.trim()) problems.push("SHOP_ID is required");
  if (!ingestTokenSet) problems.push("APEX_INGEST_TOKEN is required");
  const originUrlValid = isValidHttpUrl(env.ORIGIN_URL);
  if (!env.ORIGIN_URL?.trim()) {
    problems.push("ORIGIN_URL is required");
  } else if (!originUrlValid) {
    problems.push("ORIGIN_URL must be a valid HTTP(S) URL");
  }
  const configuredConfigApiUrl = env.CONFIG_API_URL?.trim();
  const configApiUrlValid = !configuredConfigApiUrl || isValidHttpUrl(configuredConfigApiUrl);
  if (!configApiUrlValid) {
    problems.push("CONFIG_API_URL must be a valid HTTP(S) URL");
  }
  const configured = problems.length === 0;
  const payload = {
    ...!configured ? { status: "misconfigured" } : {},
    configured,
    workerVersion: EDGE_WORKER_VERSION,
    shopId: env.SHOP_ID ?? "",
    originUrl: originUrlValid ? sanitizeStatusUrl(env.ORIGIN_URL) : "invalid",
    configApiUrl: !configApiUrlValid ? "invalid" : sanitizeStatusUrl(resolveConfigApiUrl(env), true),
    ingestTokenSet,
    configCacheMode: env.APEX_EDGE_CACHE && env.CONFIG_CACHE_MODE !== "off" ? "kv" : "off",
    lastConfigSource: lastConfigSources.get(env.SHOP_ID) ?? "none",
    lastConfigError: lastConfigErrors.get(env.SHOP_ID) ?? null,
    rateLimitScope: env.RATE_LIMIT_DO ? "global-do" : "per-isolate",
    edgeModeHint: configured && ingestTokenSet ? "edge" : "sdk-only",
    ...!configured ? { problems } : {}
  };
  return withWorkerVersion(Response.json(payload, {
    status: configured ? 200 : 503
  }), "status");
}
function resolveCustomerPublicationRevision(config) {
  for (const candidate of [config.publicationRevision, config.publication_revision]) {
    if (typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate >= 0) {
      return candidate;
    }
  }
  return void 0;
}
async function handleHtmlRequest(request, env, ctx) {
  const edgeRequestUrl = resolveEdgeBaselineRequestUrl(request.url);
  const targetingUrl = edgeRequestUrl.url.toString();
  const maxConfigBytes = parseRateLimitValue(
    env.MAX_CONFIG_BYTES,
    DEFAULT_MAX_CONFIG_BYTES,
    1,
    64 * 1024 * 1024
  );
  const configResult = await fetchShopConfig({
    shopId: env.SHOP_ID,
    configuredUrl: env.CONFIG_API_URL,
    kv: env.APEX_EDGE_CACHE,
    cacheMode: env.CONFIG_CACHE_MODE === "off" ? "off" : "kv",
    maxResponseBytes: maxConfigBytes,
    waitUntil: (promise) => ctx.waitUntil(promise)
  });
  lastConfigSources.set(env.SHOP_ID, configResult.source);
  if (configResult.error) {
    lastConfigErrors.set(env.SHOP_ID, {
      message: configResult.error.slice(0, 200),
      at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else if (configResult.source === "network") {
    lastConfigErrors.delete(env.SHOP_ID);
  }
  if (!configResult.config) {
    if (configResult.source === "oversized") {
      return sdkOnlyResponse(request, env, edgeRequestUrl.url, 1);
    }
    return withWorkerVersion(
      await fetchOrigin(request, env, edgeRequestUrl.url),
      "config-unavailable"
    );
  }
  if (getConfigByteLength(configResult.config) > maxConfigBytes) {
    return sdkOnlyResponse(request, env, edgeRequestUrl.url, 1, configResult.config.delivery?.scriptUrl);
  }
  if (decideVersionGuard(configResult.config) === "sdk-only" || !env.APEX_INGEST_TOKEN?.trim()) {
    return sdkOnlyResponse(request, env, edgeRequestUrl.url, 0, configResult.config.delivery?.scriptUrl);
  }
  const config = configResult.config;
  const cookieHeader = request.headers.get("Cookie");
  const initialVisitorId = parseCookieValue(cookieHeader, "drip_uid") ?? randomHexId(16);
  const shouldSetInitialVisitorCookie = parseCookieValue(cookieHeader, "drip_uid") == null;
  const edgeConsentGranted = parseCookieValue(cookieHeader, "drip_consent") === "1";
  const assignmentInputs = resolveCustomerAssignmentInputs(
    config,
    targetingUrl,
    cookieHeader,
    false
  );
  const visitor = resolveEdgeVisitorContext(
    initialVisitorId,
    shouldSetInitialVisitorCookie,
    config,
    edgeConsentGranted,
    void 0,
    assignmentInputs.qaMode
  );
  const { forceMap, qaMode } = assignmentInputs;
  const stickySelections = visitor.strictConsentPending ? void 0 : assignmentInputs.stickySelections;
  const assignments = evaluateEdgeAssignments(
    config.experiments,
    targetingUrl,
    visitor.visitorId,
    config.exclusionGroups,
    stickySelections,
    forceMap,
    config,
    qaMode,
    request.cf?.country
  );
  const mutationAssignments = edgeRequestUrl.baselineRequested ? [] : filterMutationAssignments(assignments);
  const runtimeAssignments = edgeRequestUrl.baselineRequested ? [] : assignments.map(
    (assignment) => assignment.attributableOnly === true ? { ...assignment, mutations: [] } : assignment
  );
  const mutations = flattenMutations(mutationAssignments);
  const holdoutConfigEpoch = parseHoldoutConfigEpoch(config.holdout_config_updated_at);
  const runtimeScriptRequired = runtimeAssignments.some(
    (assignment) => assignment.attributableOnly === true || assignment.mutations.length > 0
  );
  const canUseHtmlCache = canUseCustomerHtmlCache({
    shouldSetVisitorCookie: visitor.shouldSetVisitorCookie,
    strictConsentPending: visitor.strictConsentPending,
    programCohort: visitor.programCohort,
    holdoutConfigEpoch,
    cookieHeader
  }) && !edgeRequestUrl.baselineRequested;
  const htmlCacheKey = buildCustomerHtmlCacheKey(
    edgeRequestUrl.url,
    env,
    runtimeAssignments,
    runtimeScriptRequired,
    visitor.programCohort,
    holdoutConfigEpoch,
    resolveCustomerPublicationRevision(config)
  );
  if (canUseHtmlCache) {
    const cached = await caches.default.match(htmlCacheKey);
    if (cached) {
      const headers2 = new Headers(cached.headers);
      headers2.set("Cache-Control", "private, no-store");
      return withWorkerVersion(new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers2
      }), "html-cache");
    }
  }
  const origin = await fetchOrigin(request, env, edgeRequestUrl.url);
  if (!isHtmlResponse(origin)) return withWorkerVersion(origin, "content-type-passthrough");
  const rewriter = new HTMLRewriter();
  const maxMutationBytes = parseRateLimitValue(
    env.MAX_MUTATION_BYTES,
    DEFAULT_MAX_MUTATION_BYTES,
    1,
    16 * 1024 * 1024
  );
  let skippedMutationCount = 0;
  for (const assignment of mutationAssignments) {
    for (const mutation of assignment.mutations) {
      if (getMutationByteLength(mutation) > maxMutationBytes) {
        skippedMutationCount += 1;
        continue;
      }
      if (mutation.action === "insertBefore" || mutation.action === "insertAfter") {
        continue;
      }
      try {
        applyMutationToRewriter(rewriter, mutation);
      } catch {
      }
    }
  }
  const runtimeScript = runtimeScriptRequired ? buildEdgeRuntimeScript(
    runtimeAssignments,
    new URL(request.url).origin + EVENTS_PATH,
    env.SHOP_ID,
    "",
    void 0,
    visitor.strictConsentPending,
    visitor.programCohort,
    visitor.strictConsentPending ? visitor.visitorId : void 0,
    qaMode,
    holdoutConfigEpoch
  ) : "";
  appendEdgeRuntimeScript(rewriter, runtimeScript, "");
  appendClientSdkWhenMissing(rewriter, env.SHOP_ID, true, config.delivery?.scriptUrl);
  const transformed = rewriter.transform(origin);
  const headers = new Headers(transformed.headers);
  headers.delete("Content-Length");
  headers.set("Cache-Control", "private, no-store");
  mergeVaryCookie(headers);
  if (visitor.shouldSetVisitorCookie) {
    headers.append("Set-Cookie", makeVisitorCookie(visitor.visitorId));
  }
  const response = withWorkerVersion(new Response(transformed.body, {
    status: transformed.status,
    statusText: transformed.statusText,
    headers
  }), mutations.length > 0 ? "rewrite+preapply" : runtimeScript ? "preapply" : "sdk-proxy", skippedMutationCount);
  if (canUseHtmlCache && response.status === 200 && !response.headers.has("Set-Cookie")) {
    await warmEdgeHtmlCache(htmlCacheKey, response, EDGE_HTML_CACHE_TTL_SECONDS, ctx);
  }
  return response;
}
async function handleFetch(request, env, ctx) {
  const lane = classifyRequest(request);
  if (lane === "html" || lane === "passthrough") ctx.passThroughOnException();
  if (lane === "events-method-not-allowed") {
    return withWorkerVersion(new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" }
    }), "events-method-not-allowed");
  }
  if (lane === "status-method-not-allowed") {
    return withWorkerVersion(new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET" }
    }), "status-method-not-allowed");
  }
  if (lane === "status") return handleStatusRequest(request, env);
  if (lane === "events") return proxyEvents(request, env);
  if (lane === "replay") return proxyEvents(request, env, REPLAY_UPSTREAM_URL);
  if (lane === "passthrough") {
    return withWorkerVersion(await fetchOrigin(request, env), "request-passthrough");
  }
  return handleHtmlRequest(request, env, ctx);
}
var index_default = {
  fetch: handleFetch
};
export {
  ApexRateLimiterDO,
  DEFAULT_MAX_CONFIG_BYTES,
  DEFAULT_MAX_MUTATION_BYTES,
  DEFAULT_ORIGIN_FETCH_TIMEOUT_MS,
  appendClientSdkWhenMissing,
  buildCustomerHtmlCacheKey,
  canUseCustomerHtmlCache,
  index_default as default,
  fetchOrigin,
  getMutationByteLength,
  handleFetch,
  resolveCustomerAssignmentInputs,
  resolveCustomerPublicationRevision
};
