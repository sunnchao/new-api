export const meta = {
  apiVersion: 1,
  key: "xai-video",
  name: "xAI Video",
  icon: "XAI.Color",
  description: {
    en: "xAI Grok Imagine video generation (text-to-video and image-to-video)",
    zh: "xAI Grok Imagine 视频生成（文生视频、图生视频）",
  },
  version: "1.0.0",
  author: { name: "QuantumNous" },
  channelTypes: [48],
  models: ["grok-imagine-video", "grok-imagine-video-1.5"],
  fetchMode: "per_task",
  usageSchema: {
    seconds: {
      type: "number",
      unit: "second",
      description: {
        en: "Requested video duration in seconds. Allowed range is 1 to 15.",
        zh: "请求的视频时长，单位为秒。允许范围为 1 到 15。",
      },
    },
    resolution: {
      enum: ["480p", "720p", "1080p"],
      description: { en: "Requested output video resolution.", zh: "请求的输出视频分辨率。" },
    },
  },
  usageExamples: [
    { label: "480p 5s", facts: { seconds: 5, resolution: "480p" } },
    { label: "720p 10s", facts: { seconds: 10, resolution: "720p" } },
    { label: "1.5 1080p 5s", facts: { seconds: 5, resolution: "1080p" } },
  ],
  protocols: [{ name: "openai_responses", supports: ["stream", "sync", "background"] }, "openai_video"],
  routes: [{ method: "POST", path: "/v1/videos/generations", type: "submit", decode: "decodeSubmit", render: "taskCreated" }],
};

const RESOLUTIONS = ["480p", "720p", "1080p"];
const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"];

function trimmed(value) {
  return String(value || "").trim();
}

function responsesInput(req) {
  const texts = [],
    images = [];
  const input = req.input;
  if (typeof input === "string") texts.push(input);
  else if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        texts.push(item);
        continue;
      }
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const content = item.content === undefined ? [item] : Array.isArray(item.content) ? item.content : [item.content];
      for (const part of content) {
        if (typeof part === "string") {
          texts.push(part);
          continue;
        }
        if (!part || typeof part !== "object" || Array.isArray(part)) continue;
        if (["input_text", "text"].includes(part.type) && typeof part.text === "string") texts.push(part.text);
        if (["input_image", "image_url"].includes(part.type)) {
          let image = part.image_url;
          if (image && typeof image === "object") image = image.url;
          if (trimmed(image)) images.push(trimmed(image));
        }
      }
    }
  }
  return {
    prompt: texts
      .filter(function (text) {
        return trimmed(text);
      })
      .join("\n"),
    images: images,
  };
}

function responsesVideoText(ctx) {
  const artifact = ctx && ctx.artifacts && ctx.artifacts.video;
  const url = trimmed(artifact && artifact.url);
  if (!url) throw new Error("video artifact is unavailable");
  const escaped = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return '<video controls src="' + escaped + '"></video>';
}

function validateDuration(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 15) throw new Error("duration must be an integer between 1 and 15");
  return n;
}

function resolutionFromSize(size) {
  const value = trimmed(size).toLowerCase();
  if (!value) return "";
  if (RESOLUTIONS.indexOf(value) >= 0) return value;
  if (value.includes("1080")) return "1080p";
  if (value.includes("720")) return "720p";
  if (value.includes("480")) return "480p";
  return "";
}

function outboundDuration(req) {
  const n = Number(req && (req.duration === undefined ? req.seconds : req.duration));
  if (Number.isFinite(n) && n > 0) return n;
  const metadata = (req && req.metadata) || {};
  const fromMeta = Number(metadata.duration);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
  return 5;
}

function outboundResolution(req) {
  const metadata = (req && req.metadata) || {};
  const fromResolution = resolutionFromSize((req && req.resolution) || metadata.resolution);
  if (fromResolution) return fromResolution;
  const fromSize = resolutionFromSize(req && req.size);
  if (fromSize) return fromSize;
  return "480p";
}

function validateCombo(model, duration, resolution) {
  validateDuration(duration);
  if (RESOLUTIONS.indexOf(resolution) < 0) throw new Error("resolution must be 480p, 720p, or 1080p");
  if (resolution === "1080p" && model !== "grok-imagine-video-1.5") {
    throw new Error("1080p is only supported by grok-imagine-video-1.5");
  }
}

function hasXaiImage(req) {
  const metadata = (req && req.metadata) || {};
  return Boolean(trimmed(req && req.input_reference) || trimmed(req && req.image) || trimmed(metadata.image));
}

function optionalAspectRatio(req) {
  const metadata = (req && req.metadata) || {};
  const value = trimmed((req && req.aspect_ratio) || metadata.aspect_ratio);
  if (!value) return "";
  if (ASPECT_RATIOS.indexOf(value) < 0) throw new Error("aspect_ratio is invalid");
  return value;
}

function decodeNativeSubmit(ctx) {
  if (!ctx.body || ctx.body.kind !== "json") throw new Error("JSON body required");
  const body = ctx.body.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("request body must be an object");
  const model = trimmed(body.model);
  if (!model) throw new Error("model is required");
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!trimmed(prompt)) throw new Error("prompt is required");
  const duration = body.duration === undefined ? 5 : Number(body.duration);
  const resolution = outboundResolution(body);
  validateCombo(model, duration, resolution);
  const requestBody = { model: model, prompt: prompt, duration: duration, resolution: resolution };
  const aspectRatio = optionalAspectRatio(body);
  if (aspectRatio) requestBody.aspect_ratio = aspectRatio;
  if (body.generate_audio !== undefined) requestBody.generate_audio = body.generate_audio;
  if (trimmed(body.image)) requestBody.image = trimmed(body.image);
  return {
    kind: "submit",
    model: model,
    action: requestBody.image ? "image_to_video" : "text_to_video",
    requestBody: requestBody,
  };
}

export const native = {
  decodeSubmit: decodeNativeSubmit,
  taskCreated: function (ctx, task) {
    return { request_id: task.task_id, id: task.task_id };
  },
  error: function (ctx, error) {
    return { error: { message: error.message, code: error.code } };
  },
};

export function buildSubmitRequest(ctx) {
  const req = ctx.requestBody || {};
  if (!trimmed(req.prompt)) throw new Error("prompt is required");
  const model = ctx.upstreamModel || req.model;
  const duration = outboundDuration(req);
  const resolution = outboundResolution(req);
  validateCombo(model, duration, resolution);
  const body = {
    model: model,
    prompt: req.prompt,
    duration: duration,
    resolution: resolution,
  };
  const aspectRatio = optionalAspectRatio(req);
  if (aspectRatio) body.aspect_ratio = aspectRatio;
  if (req.generate_audio !== undefined) body.generate_audio = req.generate_audio;
  else if (req.metadata && req.metadata.generate_audio !== undefined) body.generate_audio = req.metadata.generate_audio;
  const image = trimmed(req.image || req.input_reference || ((req.metadata || {}).image));
  if (image) body.image = image;
  return {
    url: ctx.baseUrl + "/v1/videos/generations",
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + ctx.apiKey },
    body: body,
    action: image ? "image_to_video" : "text_to_video",
  };
}

export function parseSubmitResponse(ctx, resp) {
  const body = resp.body || {};
  const taskId = body.request_id || body.id || body.task_id;
  if (!taskId) throw new Error("missing request_id");
  return { taskId: taskId, taskData: body };
}

export function extractUsage(ctx) {
  if (ctx.usagePurpose === "billing_ratios") return null;
  const req = ctx.requestBody || {};
  return { seconds: outboundDuration(req), resolution: outboundResolution(req) };
}

export function buildQueryRequest(ctx) {
  return {
    url: ctx.baseUrl + "/v1/videos/" + encodeURIComponent(ctx.taskId),
    method: "GET",
    headers: { Accept: "application/json", Authorization: "Bearer " + ctx.apiKey },
  };
}

export function parseTaskResult(ctx, body) {
  const statuses = {
    queued: "QUEUED",
    pending: "QUEUED",
    processing: "IN_PROGRESS",
    in_progress: "IN_PROGRESS",
    completed: "SUCCESS",
    done: "SUCCESS",
    success: "SUCCESS",
    failed: "FAILURE",
    cancelled: "FAILURE",
    expired: "FAILURE",
  };
  const status = statuses[trimmed(body.status).toLowerCase()] || "UNKNOWN";
  const result = { status: status };
  if (body.progress > 0 && body.progress < 100) result.progress = body.progress + "%";
  if (status === "SUCCESS" || status === "FAILURE") result.progress = "100%";
  if (status === "FAILURE") result.reason = body.error && body.error.message ? body.error.message : "task failed";
  const url = trimmed((body.video && body.video.url) || body.url);
  if (url) result.url = url;
  return result;
}

function artifactVideoURL(ctx) {
  const data = (ctx && ctx.data) || {};
  if (data.video && typeof data.video === "object") return trimmed(data.video.url);
  return trimmed(data.url);
}

export function listArtifacts(task) {
  return task.status === "SUCCESS" ? [{ key: "video", type: "video", mimeType: "video/mp4" }] : [];
}

export function buildContentRequest(ctx) {
  if (ctx.artifactKey !== "video") throw new Error("artifact_not_found");
  const url = artifactVideoURL(ctx);
  if (url) return { url: url, method: ctx.clientRequest.method, credentialless: true };
  if (!ctx.upstreamTaskId) throw new Error("artifact_not_found");
  return {
    url: ctx.baseUrl + "/v1/videos/" + encodeURIComponent(ctx.upstreamTaskId) + "/content",
    method: ctx.clientRequest.method,
    headers: { Authorization: "Bearer " + ctx.apiKey },
  };
}

export function extractUsageOnComplete(_task, _taskResult, body) {
  const facts = {};
  const seconds = Number((body || {}).duration || (body || {}).seconds || 0);
  if (Number.isInteger(seconds) && seconds >= 1 && seconds <= 15) facts.seconds = seconds;
  const resolution = resolutionFromSize((body || {}).resolution || (body || {}).size);
  if (resolution) facts.resolution = resolution;
  return Object.keys(facts).length ? facts : null;
}

export const protocols = {
  openai_responses: {
    decodeRequest: function (ctx) {
      if (!ctx.body || ctx.body.kind !== "json") throw new Error("JSON body required");
      const req = ctx.body.value;
      if (!req || typeof req !== "object" || Array.isArray(req)) throw new Error("request body must be an object");
      const model = trimmed(req.model);
      if (!model) throw new Error("model is required");
      if (req.input !== undefined && typeof req.input !== "string" && !Array.isArray(req.input)) throw new Error("input must be a string or array");
      if (req.images !== undefined && !Array.isArray(req.images)) throw new Error("images must be an array");
      if (req.metadata !== undefined && (!req.metadata || typeof req.metadata !== "object" || Array.isArray(req.metadata)))
        throw new Error("metadata must be an object");
      const input = responsesInput(req);
      const prompt = input.prompt || trimmed(req.prompt);
      const images = [];
      for (const image of [req.image, req.input_reference].concat(req.images || [], input.images)) {
        if (trimmed(image) && !images.includes(trimmed(image))) images.push(trimmed(image));
      }
      if (!prompt && images.length === 0) throw new Error("input is required");
      const requestBody = { model: model, prompt: prompt };
      if (images.length) requestBody.image = images[0];
      if (Object.prototype.hasOwnProperty.call(req, "seconds")) requestBody.duration = req.seconds;
      else if (Object.prototype.hasOwnProperty.call(req, "duration")) requestBody.duration = req.duration;
      if (Object.prototype.hasOwnProperty.call(req, "size")) requestBody.size = req.size;
      else if (Object.prototype.hasOwnProperty.call(req, "resolution")) requestBody.resolution = req.resolution;
      if (Object.prototype.hasOwnProperty.call(req, "aspect_ratio")) requestBody.aspect_ratio = req.aspect_ratio;
      if (Object.prototype.hasOwnProperty.call(req, "generate_audio")) requestBody.generate_audio = req.generate_audio;
      if (Object.prototype.hasOwnProperty.call(req, "metadata")) requestBody.metadata = req.metadata;
      const duration = requestBody.duration === undefined ? 5 : Number(requestBody.duration);
      const resolution = outboundResolution(requestBody);
      validateCombo(ctx.upstreamModel || model, duration, resolution);
      requestBody.duration = duration;
      requestBody.resolution = resolution;
      return { kind: "submit", model: model, action: images.length ? "image_to_video" : "text_to_video", requestBody: requestBody };
    },
    renderEvents: function (ctx, task, previousState) {
      const status = String(task.status || "UNKNOWN").toUpperCase();
      const value = Number(String(task.progress || "").replace("%", ""));
      const progress = Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
      const state = { status: status, progress: progress };
      if (status === "SUCCESS") {
        const text = responsesVideoText(ctx);
        const events = previousState && previousState.status === status ? [] : [{ type: "output", data: text }];
        return { events: events, state: state, done: true };
      }
      if (status === "FAILURE")
        return { events: [{ type: "error", code: "task_failed", message: task.fail_reason || "task failed" }], state: state, done: true };
      if (previousState && previousState.status === status && previousState.progress === progress) return { events: [], state: state, done: false };
      const event = { type: "progress", message: status.toLowerCase() };
      if (progress !== null) event.progress = progress;
      return { events: [event], state: state, done: false };
    },
    renderFinal: function (ctx, _task) {
      return {
        output: [
          {
            type: "message",
            status: "completed",
            role: "assistant",
            content: [{ type: "output_text", text: responsesVideoText(ctx), annotations: [], logprobs: [] }],
          },
        ],
        metadata: { vendor: "xai-video" },
      };
    },
  },
};

const legacyRenderers = {
  openai_video: function (task) {
    const statuses = { NOT_START: "queued", SUBMITTED: "queued", QUEUED: "queued", IN_PROGRESS: "in_progress", SUCCESS: "completed", FAILURE: "failed" };
    const output = {
      id: task.task_id,
      object: "video",
      model: task.properties && task.properties.origin_model_name ? task.properties.origin_model_name : "",
      status: statuses[task.status] || "unknown",
      progress: Number(String(task.progress || "0").replace("%", "")),
      created_at: task.created_at,
    };
    if (task.updated_at) output.completed_at = task.updated_at;
    if (task.status === "FAILURE") output.error = { message: task.fail_reason || "task failed", code: "video_generation_failed" };
    return output;
  },
};

protocols.openai_video = {
  decodeRequest: function (ctx) {
    if (!ctx.body || (ctx.body.kind !== "json" && ctx.body.kind !== "multipart")) throw new Error("JSON or multipart body required");
    let req;
    if (ctx.body.kind === "json") {
      if (!ctx.body.value || Array.isArray(ctx.body.value)) throw new Error("JSON object required");
      req = Object.assign({}, ctx.body.value);
    } else {
      const first = function (name) {
        const values = (ctx.body.fields || {})[name] || [];
        if (values.length > 1) throw new Error(name + " must be provided once");
        return values[0];
      };
      req = {};
      const fields = ctx.body.fields || {};
      for (const name of Object.keys(fields)) {
        req[name] = first(name);
      }
      if ((ctx.body.files || []).length) throw new Error("image file upload is not supported");
      if (req.metadata !== undefined) {
        let parsed;
        try {
          parsed = JSON.parse(req.metadata);
        } catch (e) {
          throw new Error("metadata must be a JSON object string");
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("metadata must be a JSON object string");
        req.metadata = parsed;
      }
      if (req.seconds !== undefined) req.seconds = Number(req.seconds);
      else if (req.duration !== undefined) req.seconds = Number(req.duration);
    }
    const seconds = req.seconds === undefined ? req.duration : req.seconds;
    if (seconds !== undefined) req.duration = Number(seconds);
    const duration = req.duration === undefined ? 5 : Number(req.duration);
    const resolution = outboundResolution(req);
    validateCombo(ctx.upstreamModel || ctx.model, duration, resolution);
    req.duration = duration;
    req.resolution = resolution;
    const image = trimmed(req.input_reference || req.image);
    if (image) req.image = image;
    return {
      kind: "submit",
      model: ctx.model,
      action: hasXaiImage(req) ? "image_to_video" : "text_to_video",
      requestBody: Object.assign({}, req, { model: ctx.model, duration: duration, resolution: resolution }),
    };
  },
  render: function (ctx, task) {
    return legacyRenderers.openai_video(task);
  },
};
