import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Rate, Trend } from 'k6/metrics';

const API_BASE_URL =
  __ENV.API_BASE_URL ||
  'https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api';
const MODE = (__ENV.MODE || 'both').toLowerCase();
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || '2m';
const THINK_TIME = Number(__ENV.THINK_TIME || 0.3);
const DALL_E_RATIO = Number(__ENV.DALL_E_RATIO || 0.5);
const TOTAL_CALLS = Number(__ENV.TOTAL_CALLS || 0);
const CONCURRENCY = Number(__ENV.CONCURRENCY || 1);
const MAX_DURATION = __ENV.MAX_DURATION || '30m';
const INTERVAL_SECONDS = Number(__ENV.INTERVAL_SECONDS || 0);
const liveLogRaw = String(__ENV.LIVE_LOG || '').toLowerCase();
const LIVE_LOG = !['0', 'false', 'no', 'off'].includes(liveLogRaw);
const LIVE_LOG_BODY_CHARS = Number(__ENV.LIVE_LOG_BODY_CHARS || 220);
const URLS_LIMIT = Math.max(1, Number(__ENV.URLS_LIMIT || 12));
const URLS_AFTER_ID = Math.max(0, Number(__ENV.URLS_AFTER_ID || 0));
const urlsIncludeRaw = String(__ENV.URLS_INCLUDE_URL || 'true').toLowerCase();
const URLS_INCLUDE_URL = !['0', 'false', 'no', 'off'].includes(urlsIncludeRaw);
const urlsWalkRaw = String(__ENV.URLS_WALK_CURSOR || '').toLowerCase();
const URLS_WALK_CURSOR = ['1', 'true', 'yes', 'on'].includes(urlsWalkRaw);
const CUSTOM_PROMPT = String(__ENV.CUSTOM_PROMPT || '').trim();
const FORCE_DEFAULT_PROMPT_RAW = String(__ENV.FORCE_DEFAULT_PROMPT || 'true').toLowerCase();
const FORCE_DEFAULT_PROMPT = !['0', 'false', 'no', 'off'].includes(FORCE_DEFAULT_PROMPT_RAW);
const HTTP_TIMEOUT = String(__ENV.HTTP_TIMEOUT || '120s').trim();

const IMAGE_URL = `${API_BASE_URL}/image`;
const GOOGLE_URL = `${API_BASE_URL}/image/google`;
const CAREERS_URL = `${API_BASE_URL}/image/careers`;
const GOOGLE_CAREERS_URL = `${API_BASE_URL}/image/google/careers`;
const URLS_STREAM_URL = `${API_BASE_URL}/image/urls/stream`;

const PROMPTS = [
  'Avatar jeune adulte confiant, style sport, icones metiers autour',
  'Avatar creatif avec expression inspiree et posture dynamique',
  'Avatar professionnel calme avec accessoires technologiques',
  'Avatar energie positive, tenue moderne, centres interet sciences',
  'Avatar entraide et communication, style visuel clair et net',
];

const DEFAULT_IMAGE_PROMPT = `Crée un avatar inspirant représentant une personne jeune adulte (environ 30 ans) avec les
traits physiques, compétences et centres d’intérêt suivants :
Genre : Masculin
Cheveux : dfdff
Teint : Clair
Expression du visage : Calme
Posture : Relax / décontracté
Style vestimentaire : Sport
Mot(s) pour décrire l’avatar : dfdfdf
Compétences et qualités :
Compétences : Résolution de problèmes, Confiance en soi, Coopération, Pensée stratégique, Gestion du stress, Confiance en soi
Centres d’intérêt : Commerce, communication & marketing
Métiers possibles : à explorer
Le rendu doit être une illustration de type dessin (pas une photo réaliste).

Les compétences et centres d’intérêt doivent influencer l’apparence et les accessoires de l’avatar.
Important : inclure du texte lisible en français dans l’image.
Le texte doit être propre, net, correctement orthographié, sans lettres déformées.
Utiliser une police simple sans-serif, en MAJUSCULES, avec fort contraste sur un fond uni.
Limiter chaque libellé à 1 à 3 mots maximum.
Ne pas inventer de texte hors des informations fournies ci-dessus.`;

const apiSuccess = new Rate('api_success');
const apiHasUrl = new Rate('api_has_url');
const apiReqDuration = new Trend('api_req_duration', true);
const apiItemsCount = new Trend('api_items_count', true);
const apiRespBytes = new Trend('api_response_bytes', true);

let urlsCursor = URLS_AFTER_ID;

const thresholds = {
  http_req_failed: ['rate<0.1'],
  http_req_duration: ['p(95)<60000'],
  api_success: ['rate>0.9'],
  api_has_url: ['rate>0.9'],
  checks: ['rate>0.9'],
};

export const options =
  TOTAL_CALLS > 0
    ? {
        scenarios: {
          fixed_calls: {
            executor: 'shared-iterations',
            vus: Math.max(1, CONCURRENCY),
            iterations: Math.max(1, TOTAL_CALLS),
            maxDuration: MAX_DURATION,
          },
        },
        thresholds,
        summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
      }
    : {
        vus: VUS,
        duration: DURATION,
        thresholds,
        summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
      };

function waitForScheduledSlot() {
  if (!(TOTAL_CALLS > 0 && INTERVAL_SECONDS > 0)) {
    return;
  }

  const iteration = exec.scenario.iterationInTest;
  const startRaw = exec.scenario.startTime;
  const startMs =
    typeof startRaw === 'number'
      ? startRaw
      : Date.parse(String(startRaw || new Date().toISOString()));

  if (!Number.isFinite(startMs)) {
    return;
  }

  const targetMs = startMs + iteration * INTERVAL_SECONDS * 1000;
  const delaySeconds = (targetMs - Date.now()) / 1000;

  if (delaySeconds > 0) {
    sleep(delaySeconds);
  }
}

function pickPrompt() {
  if (CUSTOM_PROMPT) {
    return CUSTOM_PROMPT;
  }
  if (FORCE_DEFAULT_PROMPT) {
    return DEFAULT_IMAGE_PROMPT;
  }
  const index = exec.scenario.iterationInTest % PROMPTS.length;
  return PROMPTS[index];
}

function pickEndpoint() {
  if (MODE === 'urls' || MODE === 'stream' || MODE === 'urls_stream') {
    return { url: URLS_STREAM_URL, tag: 'urls_stream', kind: 'urls_stream', method: 'GET' };
  }

  if (MODE === 'careers') {
    return { url: CAREERS_URL, tag: 'careers', kind: 'careers_select', method: 'POST' };
  }

  if (
    MODE === 'google_careers' ||
    MODE === 'google-careers' ||
    MODE === 'careers_google' ||
    MODE === 'careers-google'
  ) {
    return { url: GOOGLE_CAREERS_URL, tag: 'google_careers', kind: 'careers_select', method: 'POST' };
  }

  if (MODE === 'dalle') {
    return { url: IMAGE_URL, tag: 'dalle', kind: 'image_generate', method: 'POST' };
  }

  if (MODE === 'google') {
    return { url: GOOGLE_URL, tag: 'google', kind: 'image_generate', method: 'POST' };
  }

  if (Math.random() < DALL_E_RATIO) {
    return { url: IMAGE_URL, tag: 'dalle', kind: 'image_generate', method: 'POST' };
  }

  return { url: GOOGLE_URL, tag: 'google', kind: 'image_generate', method: 'POST' };
}

function parseApiResponse(response) {
  try {
    return response.json();
  } catch (_err) {
    return null;
  }
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function extractStreamArray(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  if (Array.isArray(parsed.urls)) return parsed.urls;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (Array.isArray(parsed.results)) return parsed.results;
  if (Array.isArray(parsed.value)) return parsed.value;
  return null;
}

function getStreamMeta(parsed) {
  const list = extractStreamArray(parsed);
  const hasList = Array.isArray(list);

  let urlCount = 0;
  if (hasList) {
    for (const item of list) {
      if (typeof item === 'string') {
        if (item.trim()) {
          urlCount += 1;
        }
        continue;
      }
      if (
        item &&
        typeof item === 'object' &&
        typeof item.url === 'string' &&
        item.url.trim()
      ) {
        urlCount += 1;
      }
    }
  }

  let nextAfterId = null;
  let hasMore = null;
  if (parsed && typeof parsed === 'object') {
    nextAfterId = parseNumber(parsed.nextAfterId);
    hasMore = typeof parsed.hasMore === 'boolean' ? parsed.hasMore : null;
  }

  return {
    hasList,
    urlCount,
    nextAfterId,
    hasMore,
  };
}

function getCareersMeta(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return {
      hasCareersList: false,
      careersCount: 0,
      hasEnrichedPrompt: false,
      isFallback: null,
    };
  }

  const careers = Array.isArray(parsed.suggestedCareers)
    ? parsed.suggestedCareers.filter((career) => typeof career === 'string' && career.trim() !== '')
    : [];
  const hasEnrichedPrompt =
    typeof parsed.enrichedPrompt === 'string' && parsed.enrichedPrompt.trim().length > 0;
  const isFallback = typeof parsed.isFallback === 'boolean' ? parsed.isFallback : null;

  return {
    hasCareersList: Array.isArray(parsed.suggestedCareers),
    careersCount: careers.length,
    hasEnrichedPrompt,
    isFallback,
  };
}

function compactText(value) {
  if (!value) {
    return '';
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

function buildStreamUrl(afterId) {
  const includeUrl = URLS_INCLUDE_URL ? 'true' : 'false';
  return `${URLS_STREAM_URL}?afterId=${afterId}&limit=${URLS_LIMIT}&includeUrl=${includeUrl}`;
}

function withRequestTimeout(params) {
  if (!HTTP_TIMEOUT) {
    return params;
  }
  return {
    ...params,
    timeout: HTTP_TIMEOUT,
  };
}

function logLiveCall(endpoint, response, meta) {
  if (!LIVE_LOG) {
    return;
  }

  const bodyPreview = compactText(response.body).slice(0, LIVE_LOG_BODY_CHARS);
  const vuId = exec.vu.idInTest;
  const iteration = exec.scenario.iterationInTest;
  const base =
    `[LIVE] vu=${vuId} iter=${iteration} endpoint=${endpoint.tag} status=${response.status}` +
    ` durationMs=${Math.round(response.timings.duration)} hasUrl=${meta.hasUrl}`;

  if (endpoint.kind === 'urls_stream') {
    console.log(
      `${base} urlsCount=${meta.urlsCount} hasList=${meta.hasList} afterId=${meta.afterId}` +
        ` nextAfterId=${meta.nextAfterId ?? ''} hasMore=${meta.hasMore ?? ''} requestUrl="${meta.requestUrl}" body="${bodyPreview}"`
    );
    return;
  }

  if (endpoint.kind === 'careers_select') {
    const enrichedPromptPreview = compactText(meta.parsed?.enrichedPrompt || '').slice(0, 120);
    const promptPreview = compactText(meta.prompt).slice(0, 120);
    console.log(
      `${base} careersCount=${meta.careersCount} hasEnrichedPrompt=${meta.hasEnrichedPrompt}` +
        ` isFallback=${meta.isFallback ?? ''} prompt="${promptPreview}" enrichedPrompt="${enrichedPromptPreview}" body="${bodyPreview}"`
    );
    return;
  }

  const imageUrl = meta.parsed && meta.parsed.url ? String(meta.parsed.url) : '';
  const errorMessage = meta.parsed && meta.parsed.error ? compactText(meta.parsed.error) : '';
  const promptPreview = compactText(meta.prompt).slice(0, 120);
  console.log(
    `${base} imageUrl="${imageUrl}" error="${errorMessage}" prompt="${promptPreview}" body="${bodyPreview}"`
  );
}

export default function () {
  waitForScheduledSlot();

  const endpoint = pickEndpoint();
  let response;
  let prompt = '';
  let afterId = null;
  let requestUrl = endpoint.url;

  if (endpoint.kind === 'urls_stream') {
    afterId = URLS_WALK_CURSOR ? urlsCursor : URLS_AFTER_ID;
    requestUrl = buildStreamUrl(afterId);
    response = http.get(
      requestUrl,
      withRequestTimeout({ tags: { endpoint: endpoint.tag } })
    );
  } else {
    prompt = pickPrompt();
    const payload = JSON.stringify({ prompt });
    response = http.post(
      endpoint.url,
      payload,
      withRequestTimeout({
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: endpoint.tag },
      })
    );
  }

  const is2xx = response.status >= 200 && response.status < 300;
  const parsed = parseApiResponse(response);
  const streamMeta = endpoint.kind === 'urls_stream' ? getStreamMeta(parsed) : null;
  const careersMeta = endpoint.kind === 'careers_select' ? getCareersMeta(parsed) : null;
  const hasPayload =
    endpoint.kind === 'urls_stream'
      ? (streamMeta?.hasList || false)
      : endpoint.kind === 'careers_select'
        ? (careersMeta?.hasEnrichedPrompt || false) && (careersMeta?.hasCareersList || false)
        : Boolean(parsed && parsed.url);
  const successSignal = is2xx && hasPayload;

  apiSuccess.add(successSignal, { endpoint: endpoint.tag });
  apiHasUrl.add(hasPayload, { endpoint: endpoint.tag });
  apiReqDuration.add(response.timings.duration, { endpoint: endpoint.tag });
  apiItemsCount.add(
    endpoint.kind === 'urls_stream'
      ? streamMeta?.urlCount || 0
      : endpoint.kind === 'careers_select'
        ? careersMeta?.careersCount || 0
        : hasPayload
          ? 1
          : 0,
    {
      endpoint: endpoint.tag,
    }
  );
  apiRespBytes.add(response.body ? response.body.length : 0, { endpoint: endpoint.tag });

  const checksMap =
    endpoint.kind === 'urls_stream'
      ? {
          'status is 2xx': () => is2xx,
          'body contains urls list': () => (streamMeta?.hasList ? true : false),
        }
      : endpoint.kind === 'careers_select'
        ? {
            'status is 2xx': () => is2xx,
            'body contains suggestedCareers list': () => (careersMeta?.hasCareersList ? true : false),
            'body contains enrichedPrompt': () => (careersMeta?.hasEnrichedPrompt ? true : false),
          }
      : {
          'status is 2xx': () => is2xx,
          'body contains url': () => hasPayload,
        };

  check(response, checksMap);
  logLiveCall(endpoint, response, {
    hasUrl: hasPayload,
    parsed,
    prompt,
    hasList: streamMeta?.hasList || false,
    urlsCount: streamMeta?.urlCount || 0,
    careersCount: careersMeta?.careersCount || 0,
    hasEnrichedPrompt: careersMeta?.hasEnrichedPrompt || false,
    isFallback: careersMeta?.isFallback ?? null,
    afterId,
    nextAfterId: streamMeta?.nextAfterId ?? null,
    hasMore: streamMeta?.hasMore ?? null,
    requestUrl,
  });

  if (endpoint.kind === 'urls_stream' && URLS_WALK_CURSOR) {
    if (
      streamMeta?.hasMore &&
      typeof streamMeta.nextAfterId === 'number' &&
      streamMeta.nextAfterId > afterId
    ) {
      urlsCursor = streamMeta.nextAfterId;
    } else {
      urlsCursor = URLS_AFTER_ID;
    }
  }

  if (!(TOTAL_CALLS > 0 && INTERVAL_SECONDS > 0)) {
    sleep(THINK_TIME);
  }
}
