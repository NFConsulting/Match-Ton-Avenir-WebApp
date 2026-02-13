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

const IMAGE_URL = `${API_BASE_URL}/image`;
const GOOGLE_URL = `${API_BASE_URL}/image/google`;

const PROMPTS = [
  'Avatar jeune adulte confiant, style sport, icones metiers autour',
  'Avatar creatif avec expression inspiree et posture dynamique',
  'Avatar professionnel calme avec accessoires technologiques',
  'Avatar energie positive, tenue moderne, centres interet sciences',
  'Avatar entraide et communication, style visuel clair et net',
];

const apiSuccess = new Rate('api_success');
const apiHasUrl = new Rate('api_has_url');
const apiReqDuration = new Trend('api_req_duration', true);

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
  const index = exec.scenario.iterationInTest % PROMPTS.length;
  return PROMPTS[index];
}

function pickEndpoint() {
  if (MODE === 'dalle') {
    return { url: IMAGE_URL, tag: 'dalle' };
  }

  if (MODE === 'google') {
    return { url: GOOGLE_URL, tag: 'google' };
  }

  if (Math.random() < DALL_E_RATIO) {
    return { url: IMAGE_URL, tag: 'dalle' };
  }

  return { url: GOOGLE_URL, tag: 'google' };
}

function parseImageResponse(response) {
  try {
    return response.json();
  } catch (_err) {
    return null;
  }
}

function compactText(value) {
  if (!value) {
    return '';
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

function logLiveCall(endpoint, prompt, response, parsed, hasUrl) {
  if (!LIVE_LOG) {
    return;
  }

  const bodyPreview = compactText(response.body).slice(0, LIVE_LOG_BODY_CHARS);
  const imageUrl = parsed && parsed.url ? String(parsed.url) : '';
  const errorMessage = parsed && parsed.error ? compactText(parsed.error) : '';
  const promptPreview = compactText(prompt).slice(0, 120);
  const vuId = exec.vu.idInTest;
  const iteration = exec.scenario.iterationInTest;

  console.log(
    `[LIVE] vu=${vuId} iter=${iteration} endpoint=${endpoint.tag} status=${response.status} durationMs=${Math.round(response.timings.duration)} hasUrl=${hasUrl} imageUrl="${imageUrl}" error="${errorMessage}" prompt="${promptPreview}" body="${bodyPreview}"`
  );
}

export default function () {
  waitForScheduledSlot();

  const endpoint = pickEndpoint();
  const prompt = pickPrompt();
  const payload = JSON.stringify({ prompt });
  const response = http.post(endpoint.url, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: endpoint.tag },
  });
  const is2xx = response.status >= 200 && response.status < 300;
  const parsed = parseImageResponse(response);
  const hasUrl = Boolean(parsed && parsed.url);

  apiSuccess.add(is2xx && hasUrl, { endpoint: endpoint.tag });
  apiHasUrl.add(hasUrl, { endpoint: endpoint.tag });
  apiReqDuration.add(response.timings.duration, { endpoint: endpoint.tag });

  check(response, {
    'status is 2xx': () => is2xx,
    'body contains url': () => hasUrl,
  });
  logLiveCall(endpoint, prompt, response, parsed, hasUrl);

  if (!(TOTAL_CALLS > 0 && INTERVAL_SECONDS > 0)) {
    sleep(THINK_TIME);
  }
}
