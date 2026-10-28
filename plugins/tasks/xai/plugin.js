// xAI bills each output second by model and resolution, each input image, and
// on grok-imagine-video each input video second of an edit or extension
// (docs.x.ai/developers/models/<model>). Images are billed per output image
// by resolution, and grok-imagine-image-2.0 also by the quality xAI serves.
const VIDEO_MODELS = {
  // The only model that takes video input, so edits and extensions use it.
  "grok-imagine-video": { resolutions: ["480p", "720p"], videoInput: true },
  "grok-imagine-video-1.5": { resolutions: ["480p", "720p", "1080p"] },
  "grok-imagine-video-1.5-lite": { resolutions: ["480p", "720p", "1080p"] },
};

// grok-imagine-image-2.0 is the only image model that accepts quality; auto
// serves low for generation and medium for editing. The API reference also
// lists 1.5k, which the quality alias uses.
const IMAGE_MODELS = {
  "grok-imagine-image-2.0": { resolutions: ["1k", "1.5k", "2k"], quality: true },
  "grok-imagine-image-quality": { resolutions: ["1k", "1.5k", "2k"] },
  "grok-imagine-image-pro": { resolutions: ["1k", "1.5k", "2k"] },
  "grok-imagine-image": { resolutions: ["1k", "2k"] },
};
const IMAGE_ASPECT_RATIOS = [
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "2:3",
  "3:2",
  "9:19.5",
  "19.5:9",
  "9:20",
  "20:9",
  "1:2",
  "2:1",
  "21:9",
  "5:2",
  "auto",
];
const IMAGE_DEFAULT_RESOLUTION = "1k";
const IMAGE_MAX_N = 10;
// xAI multi-image editing accepts up to five source images.
const MAX_IMAGE_INPUTS = 5;
const MAX_INPUT_IMAGE_BYTES = 20971520;

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"];
const DEFAULT_RESOLUTION = "480p";
const DEFAULT_DURATION = 8;
const MAX_DURATION = 15;
const DEFAULT_EXTENSION_SECONDS = 6;
const MIN_EXTENSION_SECONDS = 2;
const MAX_EXTENSION_SECONDS = 10;
// Edits accept at most 8.7 seconds of input and return the same length.
const MAX_EDIT_SECONDS = 9;
// Extensions accept 2 to 15 seconds of input and return input plus extension.
const MAX_EXTENSION_INPUT_SECONDS = 15;
const MAX_REFERENCE_IMAGES = 7;
const MAX_KEYFRAMES = 4;
const MAX_REFERENCE_AUDIOS = 3;
// Edits and extensions keep the input video's resolution, capped at 720p,
// which neither the request nor the result reports: the cap is reserved and
// the output file's MP4 header settles the resolution.
const EDIT_RESOLUTION_CAP = "720p";

const IMAGE_UNIT_LABEL = { en: "image", zh: "张", "zh-TW": "張" };
const SECONDS_FIELD = {
  type: "number",
  unit: "second",
  description: { en: "Video generation unit price", zh: "视频生成单价" },
};
const INPUT_IMAGES_FIELD = {
  type: "number",
  unit: "count",
  unitLabel: IMAGE_UNIT_LABEL,
  description: { en: "Input image unit price", zh: "输入图片单价" },
};
const IMAGE_COUNT_FIELD = {
  type: "number",
  unit: "count",
  unitLabel: IMAGE_UNIT_LABEL,
  description: { en: "Image generation or editing unit price", zh: "图片生成或编辑单价" },
};
const INPUT_VIDEO_SECONDS_FIELD = {
  type: "number",
  unit: "second",
  description: { en: "Input video unit price", zh: "输入视频单价" },
};
// xAI still bills a request its moderation blocks ("Usage Guidelines
// Violation Fee", docs.x.ai/developers/pricing), so such a task settles as
// charged instead of refunded; this fact lets its price differ from a
// delivered video.
const MODERATED_FIELD = {
  type: "boolean",
  description: { en: "Blocked by content moderation", zh: "被内容审核拦截" },
};
const OUTPUT_RESOLUTION_DESCRIPTION = { en: "Output resolution", zh: "输出分辨率" };
const VIDEO_RESOLUTION_DESCRIPTION = { en: "Output video resolution", zh: "输出视频分辨率" };
const IMAGE_RESOLUTION_DESCRIPTION = { en: "Output image resolution", zh: "输出图片分辨率" };
const IMAGE_QUALITY_DESCRIPTION = { en: "Output image quality", zh: "输出图片质量" };

const GROK_IMAGINE_VIDEO_USAGE_SCHEMA = {
  seconds: SECONDS_FIELD,
  resolution: { enum: VIDEO_MODELS["grok-imagine-video"].resolutions, description: VIDEO_RESOLUTION_DESCRIPTION },
  input_images: INPUT_IMAGES_FIELD,
  input_video_seconds: INPUT_VIDEO_SECONDS_FIELD,
  moderated: MODERATED_FIELD,
};

const GROK_IMAGINE_VIDEO_1_5_USAGE_SCHEMA = {
  seconds: SECONDS_FIELD,
  resolution: { enum: VIDEO_MODELS["grok-imagine-video-1.5"].resolutions, description: VIDEO_RESOLUTION_DESCRIPTION },
  input_images: INPUT_IMAGES_FIELD,
  moderated: MODERATED_FIELD,
};

const GROK_IMAGINE_IMAGE_2_0_USAGE_SCHEMA = {
  image_count: IMAGE_COUNT_FIELD,
  resolution: { enum: IMAGE_MODELS["grok-imagine-image-2.0"].resolutions, description: IMAGE_RESOLUTION_DESCRIPTION },
  quality: { enum: ["low", "medium"], description: IMAGE_QUALITY_DESCRIPTION },
  input_images: INPUT_IMAGES_FIELD,
};

const GROK_IMAGINE_IMAGE_QUALITY_USAGE_SCHEMA = {
  image_count: IMAGE_COUNT_FIELD,
  resolution: { enum: IMAGE_MODELS["grok-imagine-image-quality"].resolutions, description: IMAGE_RESOLUTION_DESCRIPTION },
  input_images: INPUT_IMAGES_FIELD,
};

const GROK_IMAGINE_IMAGE_USAGE_SCHEMA = {
  image_count: IMAGE_COUNT_FIELD,
  resolution: { enum: IMAGE_MODELS["grok-imagine-image"].resolutions, description: IMAGE_RESOLUTION_DESCRIPTION },
  input_images: INPUT_IMAGES_FIELD,
};

export const meta = {
  apiVersion: 1,
  key: "xai",
  name: "xAI",
  icon: "XAI",
  description: {
    en: "xAI Grok Imagine image and video generation (text-to-image, image editing, text-to-video, image-to-video, reference-to-video, video editing, and video extension)",
    zh: "xAI Grok Imagine 图片与视频生成（文生图、图片编辑、文生视频、图生视频、参考生视频、视频编辑、视频延长）",
  },
  version: "1.2.0",
  author: { name: "QuantumNous" },
  channelTypes: [48], // xAI-type channels serve the image and video APIs with the same key
  baseUrl: "https://api.x.ai",
  // Result videos, whose headers settle the resolution of edits and extensions.
  allowedHosts: ["vidgen.x.ai"],
  models: Object.keys(VIDEO_MODELS).concat(Object.keys(IMAGE_MODELS)),
  fetchMode: "per_task",
  upstreams: ["vendor", "new_api"],
  // Fallback for a channel alias that resolves to more than one model: the
  // union of every model's fields and resolutions.
  usageSchema: Object.assign({}, GROK_IMAGINE_VIDEO_USAGE_SCHEMA, {
    resolution: {
      enum: ["480p", "720p", "1080p", "1k", "1.5k", "2k"],
      description: OUTPUT_RESOLUTION_DESCRIPTION,
    },
    image_count: IMAGE_COUNT_FIELD,
    quality: { enum: ["low", "medium"], description: IMAGE_QUALITY_DESCRIPTION },
  }),
  usageExamples: [
    {
      label: "1.5 480p 8s",
      facts: {
        seconds: 8,
        resolution: "480p",
        input_images: 0,
        input_video_seconds: 0,
        moderated: false,
        image_count: 0,
        quality: "low",
      },
    },
    {
      label: "1.5 1080p 8s · image",
      facts: {
        seconds: 8,
        resolution: "1080p",
        input_images: 1,
        input_video_seconds: 0,
        moderated: false,
        image_count: 0,
        quality: "low",
      },
    },
    {
      label: "edit 8s · 720p",
      facts: {
        seconds: 8,
        resolution: "720p",
        input_images: 0,
        input_video_seconds: 8,
        moderated: false,
        image_count: 0,
        quality: "low",
      },
    },
    {
      label: "480p 8s · blocked",
      facts: {
        seconds: 8,
        resolution: "480p",
        input_images: 0,
        input_video_seconds: 0,
        moderated: true,
        image_count: 0,
        quality: "low",
      },
    },
    {
      label: "image 2k · 1",
      facts: {
        seconds: 0,
        resolution: "2k",
        input_images: 0,
        input_video_seconds: 0,
        moderated: false,
        image_count: 1,
        quality: "medium",
      },
    },
    {
      label: "image edit 1k · 2 inputs",
      facts: {
        seconds: 0,
        resolution: "1k",
        input_images: 2,
        input_video_seconds: 0,
        moderated: false,
        image_count: 1,
        quality: "medium",
      },
    },
  ],
  usageProfiles: [
    {
      models: ["grok-imagine-video"],
      schema: GROK_IMAGINE_VIDEO_USAGE_SCHEMA,
      examples: [
        { label: "480p 8s", facts: { seconds: 8, resolution: "480p", input_images: 0, input_video_seconds: 0, moderated: false } },
        { label: "720p 8s · image", facts: { seconds: 8, resolution: "720p", input_images: 1, input_video_seconds: 0, moderated: false } },
        { label: "edit 8s · 720p", facts: { seconds: 8, resolution: "720p", input_images: 0, input_video_seconds: 8, moderated: false } },
        { label: "extend 8s + 6s · 480p", facts: { seconds: 6, resolution: "480p", input_images: 0, input_video_seconds: 8, moderated: false } },
        { label: "480p 8s · blocked", facts: { seconds: 8, resolution: "480p", input_images: 0, input_video_seconds: 0, moderated: true } },
      ],
    },
    {
      models: ["grok-imagine-video-1.5", "grok-imagine-video-1.5-lite"],
      schema: GROK_IMAGINE_VIDEO_1_5_USAGE_SCHEMA,
      examples: [
        { label: "480p 8s", facts: { seconds: 8, resolution: "480p", input_images: 0, moderated: false } },
        { label: "720p 8s · image", facts: { seconds: 8, resolution: "720p", input_images: 1, moderated: false } },
        { label: "1080p 15s", facts: { seconds: 15, resolution: "1080p", input_images: 0, moderated: false } },
        { label: "480p 8s · blocked", facts: { seconds: 8, resolution: "480p", input_images: 0, moderated: true } },
      ],
    },
    {
      models: ["grok-imagine-image-2.0"],
      schema: GROK_IMAGINE_IMAGE_2_0_USAGE_SCHEMA,
      examples: [
        { label: "1k · 1 image", facts: { image_count: 1, resolution: "1k", quality: "low", input_images: 0 } },
        { label: "2k · 1 image · medium", facts: { image_count: 1, resolution: "2k", quality: "medium", input_images: 0 } },
        { label: "2k · 4 images", facts: { image_count: 4, resolution: "2k", quality: "low", input_images: 0 } },
        { label: "edit 1k · 1 image · 2 inputs", facts: { image_count: 1, resolution: "1k", quality: "medium", input_images: 2 } },
      ],
    },
    {
      models: ["grok-imagine-image-quality", "grok-imagine-image-pro"],
      schema: GROK_IMAGINE_IMAGE_QUALITY_USAGE_SCHEMA,
      examples: [
        { label: "1k · 1 image", facts: { image_count: 1, resolution: "1k", input_images: 0 } },
        { label: "1.5k · 1 image", facts: { image_count: 1, resolution: "1.5k", input_images: 0 } },
        { label: "2k · 2 images", facts: { image_count: 2, resolution: "2k", input_images: 0 } },
        { label: "edit 2k · 1 image · 3 inputs", facts: { image_count: 1, resolution: "2k", input_images: 3 } },
      ],
    },
    {
      models: ["grok-imagine-image"],
      schema: GROK_IMAGINE_IMAGE_USAGE_SCHEMA,
      examples: [
        { label: "1k · 1 image", facts: { image_count: 1, resolution: "1k", input_images: 0 } },
        { label: "2k · 2 images", facts: { image_count: 2, resolution: "2k", input_images: 0 } },
        { label: "edit 1k · 1 image · 1 input", facts: { image_count: 1, resolution: "1k", input_images: 1 } },
      ],
    },
  ],
  routes: [
    {
      method: "POST",
      path: "/xai/v1/images/generations",
      type: "submit",
      decode: "createImageGeneration",
      render: "imageCreated",
      retainResult: false,
      models: Object.keys(IMAGE_MODELS),
    },
    {
      method: "POST",
      path: "/xai/v1/images/edits",
      type: "submit",
      decode: "createImageEdit",
      render: "imageCreated",
      retainResult: false,
      models: Object.keys(IMAGE_MODELS),
    },
    {
      method: "POST",
      path: "/xai/v1/videos/generations",
      type: "submit",
      decode: "createGeneration",
      render: "videoCreated",
      models: Object.keys(VIDEO_MODELS),
    },
    { method: "POST", path: "/xai/v1/videos/edits", type: "submit", decode: "createEdit", render: "videoCreated", models: ["grok-imagine-video"] },
    { method: "POST", path: "/xai/v1/videos/extensions", type: "submit", decode: "createExtension", render: "videoCreated", models: ["grok-imagine-video"] },
    { method: "GET", path: "/xai/v1/videos/:request_id", type: "query", taskIdParam: "request_id", render: "videoStatus" },
  ],
  protocols: [
    { name: "openai_responses", supports: ["stream", "sync", "background"], models: Object.keys(VIDEO_MODELS) },
    { name: "openai_video", models: Object.keys(VIDEO_MODELS) },
    { name: "openai_image", models: Object.keys(IMAGE_MODELS) },
  ],
};

function trimmed(value) {
  return String(value || "").trim();
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

// Another New API gateway serves the xAI wire format only on this plugin's
// prefixed native routes.
function apiRoot(ctx) {
  return ctx.baseUrl + (ctx.upstream && ctx.upstream.kind === "new_api" ? "/xai" : "");
}

function videoModel(identity) {
  const names = [identity.upstreamModel, identity.model].map(trimmed).filter(Boolean);
  for (const name of names) {
    if (VIDEO_MODELS[name]) return name;
  }
  throw new Error((names[0] || "model") + " is not a supported xAI video model");
}

function imageModel(identity) {
  const names = [identity.upstreamModel, identity.model].map(trimmed).filter(Boolean);
  for (const name of names) {
    if (IMAGE_MODELS[name]) return name;
  }
  throw new Error((names[0] || "model") + " is not a supported xAI image model");
}

function integerField(value, name, minimum, maximum) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isInteger(number) || number < minimum || number > maximum)
    throw new Error(name + " must be an integer between " + minimum + " and " + maximum);
  return number;
}

// Media inputs are URLs, base64 data URLs, or host file placeholders. A
// file_id would name a file in the gateway's own xAI account, which callers
// must not reach.
function mediaInput(value, name) {
  const object = plainObject(value);
  if (object && object.file_id !== undefined) throw new Error(name + " must be a URL; file_id is not supported");
  const url = object ? (object.url !== undefined ? object.url : object.image_url) : value;
  if (plainObject(url) && url.__fileRef) return { url: url };
  if (typeof url === "string" && url.trim()) return { url: url.trim() };
  throw new Error(name + " must be a URL or {url}");
}

function promptField(source, required) {
  if (source.prompt !== undefined && source.prompt !== null && typeof source.prompt !== "string") throw new Error("prompt must be a string");
  const prompt = trimmed(source.prompt);
  if (required && !prompt) throw new Error("prompt is required");
  return prompt;
}

// Fields every operation accepts. storage_options is never forwarded: it
// stores the output in the gateway's xAI account.
function commonFields(source, body) {
  if (source.user !== undefined && source.user !== null) {
    if (typeof source.user !== "string") throw new Error("user must be a string");
    body.user = source.user;
  }
  if (source.output !== undefined && source.output !== null) {
    const output = plainObject(source.output);
    if (!output || typeof output.upload_url !== "string" || !output.upload_url.trim()) throw new Error("output.upload_url must be a URL");
    body.output = { upload_url: output.upload_url.trim() };
  }
  return body;
}

// OpenAI image sizes select the nearest xAI aspect ratio and the resolution
// tier by the longest side, matching the legacy image-spec pricing overlay.
function imageSizeOptions(size) {
  const text = trimmed(size).toLowerCase();
  if (!text) return {};
  if (["1k", "1.5k", "2k"].includes(text)) return { resolution: text };
  if (text === "auto") return { aspect_ratio: "auto" };
  const parts = text.replace("*", "x").split("x");
  const width = Number(parts[0]);
  const height = Number(parts[1]);
  if (parts.length !== 2 || !(width > 0) || !(height > 0)) throw new Error("size must be WIDTHxHEIGHT, auto, or one of 1k, 1.5k, 2k");
  let aspectRatio = "1:1";
  let nearest = Infinity;
  for (const ratio of IMAGE_ASPECT_RATIOS) {
    if (ratio === "auto") continue;
    const sides = ratio.split(":").map(Number);
    const distance = Math.abs(Math.log(width / height) - Math.log(sides[0] / sides[1]));
    if (distance < nearest) {
      nearest = distance;
      aspectRatio = ratio;
    }
  }
  return { aspect_ratio: aspectRatio, resolution: Math.max(width, height) >= 2048 ? "2k" : "1k" };
}

// The quality xAI serves. auto means low for generation and medium for
// editing; the fact lets a price differ from a pinned quality.
function imageServedQuality(body, action) {
  const quality = trimmed(body && body.quality).toLowerCase();
  if (quality === "low" || quality === "medium") return quality;
  return action === "image_to_image" ? "medium" : "low";
}

// Validates an xAI image request and keeps only documented fields. The
// resolved resolution and effective quality are always sent or derived so the
// reserved charge matches what xAI serves.
function imageRequest(operation, source, identity) {
  const model = imageModel(identity);
  const options = IMAGE_MODELS[model];
  if (source.stream !== undefined && source.stream !== null && source.stream !== false && source.stream !== "false")
    throw new Error("stream is not supported; the complete image response is returned once all images are generated");
  if (source.deferred !== undefined && source.deferred !== null && source.deferred !== false && source.deferred !== "false")
    throw new Error("deferred image generation is not supported");
  if (source.mask !== undefined && source.mask !== null) throw new Error("mask is not supported");

  const body = { model: model, prompt: promptField(source, true) };
  body.n = source.n === undefined || source.n === null || source.n === "" ? 1 : integerField(source.n, "n", 1, IMAGE_MAX_N);
  const size = source.size === undefined || source.size === null ? {} : imageSizeOptions(source.size);
  const resolution =
    source.resolution === undefined || source.resolution === null || trimmed(source.resolution) === ""
      ? size.resolution || IMAGE_DEFAULT_RESOLUTION
      : trimmed(source.resolution).toLowerCase();
  if (!options.resolutions.includes(resolution)) throw new Error(model + " resolution must be one of " + options.resolutions.join(", "));
  body.resolution = resolution;
  const aspectRatio =
    source.aspect_ratio === undefined || source.aspect_ratio === null || trimmed(source.aspect_ratio) === ""
      ? size.aspect_ratio
      : trimmed(source.aspect_ratio);
  if (aspectRatio !== undefined) {
    if (!IMAGE_ASPECT_RATIOS.includes(aspectRatio)) throw new Error("aspect_ratio must be one of " + IMAGE_ASPECT_RATIOS.join(", "));
    body.aspect_ratio = aspectRatio;
  }

  const quality = trimmed(source.quality).toLowerCase();
  if (quality) {
    let normalized = quality;
    if (normalized === "standard") normalized = "low";
    else if (normalized === "hd") normalized = "medium";
    if (!["low", "medium", "auto"].includes(normalized)) throw new Error("quality must be low, medium, auto, standard, or hd");
    // Older image models ignore quality; only grok-imagine-image-2.0 bills it.
    if (options.quality) body.quality = normalized;
  }

  if (source.response_format !== undefined && source.response_format !== null && trimmed(source.response_format) !== "") {
    const format = trimmed(source.response_format).toLowerCase();
    if (format !== "url" && format !== "b64_json") throw new Error("response_format must be url or b64_json");
    body.response_format = format;
  }
  if (source.user !== undefined && source.user !== null) {
    if (typeof source.user !== "string") throw new Error("user must be a string");
    body.user = source.user;
  }

  const image =
    source.image === undefined ||
    source.image === null ||
    (typeof source.image === "string" && trimmed(source.image) === "")
      ? null
      : mediaInput(source.image, "image");
  if (source.images !== undefined && source.images !== null && !Array.isArray(source.images)) throw new Error("images must be an array");
  const images = (source.images || []).map(function (item, index) {
    return mediaInput(item, "images[" + index + "]");
  });
  if (operation === "edit") {
    if (image && images.length) throw new Error("image and images are mutually exclusive");
    if (!image && !images.length) throw new Error("image is required");
    if ((image ? 1 : 0) + images.length > MAX_IMAGE_INPUTS)
      throw new Error("at most " + MAX_IMAGE_INPUTS + " input images are supported");
    if (image) body.image = image;
    else body.images = images;
  } else if (image || images.length) {
    throw new Error("image input is only supported on /v1/images/edits");
  }
  return { action: operation === "edit" ? "image_to_image" : "text_to_image", body: body };
}

// Billing counts image payloads, never JSON entries: an object-shaped data is
// one image when it carries a URL or base64 body, and an array counts the
// larger of its URL and base64 payload counts.
function imagePayloads(body) {
  const data = plainObject(body) ? body.data : null;
  const payload = function (item) {
    return plainObject(item) && ((typeof item.url === "string" && item.url.trim()) || (typeof item.b64_json === "string" && item.b64_json));
  };
  if (Array.isArray(data)) return data.filter(payload);
  return payload(data) ? [data] : [];
}

function imageData(body) {
  return imagePayloads(body).map(function (item) {
    const output = {};
    if (typeof item.url === "string" && item.url.trim()) output.url = item.url.trim();
    if (typeof item.b64_json === "string" && item.b64_json) output.b64_json = item.b64_json;
    if (typeof item.revised_prompt === "string" && item.revised_prompt) output.revised_prompt = item.revised_prompt;
    return output;
  });
}

// Completion facts prefer a bounded upstream count, then count payloads. A
// missing or payload-less result returns no fact, so the reservation stays.
function imageUsageCount(body) {
  const data = plainObject(body);
  const usage = data && plainObject(data.usage) ? data.usage : {};
  const payloads = imagePayloads(data);
  if (payloads.length > IMAGE_MAX_N) throw new Error("too many output images");
  let count = payloads.length
    ? Math.max(
        payloads.filter(function (item) {
          return typeof item.url === "string" && item.url.trim();
        }).length,
        payloads.filter(function (item) {
          return typeof item.b64_json === "string" && item.b64_json;
        }).length,
      )
    : 0;
  const reported = usage.image_count;
  if (reported !== undefined) {
    if (!Number.isInteger(reported) || reported < 0 || reported > IMAGE_MAX_N || (payloads.length && reported === 0))
      throw new Error("invalid upstream image count");
    count = reported;
  }
  return count;
}

// OpenAI image edits may arrive as multipart; xAI reads images as URL or
// base64 data URL entries, so uploads become request file placeholders.
function multipartImageSource(ctx, operation) {
  const source = {};
  const fields = ctx.body.fields || {};
  for (const name of Object.keys(fields)) {
    if (fields[name].length > 1) throw new Error(name + " must be provided once");
    source[name] = fields[name][0];
  }
  if (source.n !== undefined) source.n = Number(source.n);
  for (const key of ["stream", "deferred"]) {
    if (source[key] === undefined) continue;
    if (source[key] !== "true" && source[key] !== "false") throw new Error(key + " must be true or false");
    source[key] = source[key] === "true";
  }
  const uploads = [];
  for (const file of ctx.body.files || []) {
    if (file.field === "mask") throw new Error("mask is not supported");
    if (!/^images?(\[\d*\])?$/.test(file.field)) throw new Error(file.field + " is not supported");
    uploads.push({
      url: {
        __fileRef: file.ref,
        encoding: "dataUrl",
        mimeType: trimmed(file.mimeType) || "image/png",
        maxBytes: MAX_INPUT_IMAGE_BYTES,
      },
    });
  }
  if (uploads.length) {
    if (operation !== "edit") throw new Error("image uploads are only supported on /v1/images/edits");
    if (source.image !== undefined || source.images !== undefined) throw new Error("image must be provided once");
    if (uploads.length === 1) source.image = uploads[0];
    else source.images = uploads;
  }
  return source;
}

// Validates a /v1/videos/generations request and keeps only documented
// fields, so an unlisted field cannot carry a billable quantity past these
// checks. Duration and resolution are always sent so the reserved charge
// matches what xAI renders even if its defaults change.
function generationRequest(source, identity) {
  const model = videoModel(identity);
  const image = source.image === undefined || source.image === null ? null : mediaInput(source.image, "image");
  if (source.reference_images !== undefined && source.reference_images !== null && !Array.isArray(source.reference_images))
    throw new Error("reference_images must be an array");
  if ((source.reference_images || []).length > MAX_REFERENCE_IMAGES) throw new Error("reference_images accepts at most " + MAX_REFERENCE_IMAGES + " items");
  const referenceImages = (source.reference_images || []).map(function (item, index) {
    return mediaInput(item, "reference_images[" + index + "]");
  });
  const lastFrame = source.last_frame === undefined || source.last_frame === null ? null : mediaInput(source.last_frame, "last_frame");
  if (source.keyframes !== undefined && source.keyframes !== null && !Array.isArray(source.keyframes)) throw new Error("keyframes must be an array");
  const keyframes = (source.keyframes || []).map(function (keyframe, index) {
    const object = plainObject(keyframe);
    const timestamp = object ? Number(object.timestamp_s) : NaN;
    if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error("keyframes[" + index + "].timestamp_s must be a positive number");
    return { image: mediaInput(object.image, "keyframes[" + index + "].image"), timestamp_s: timestamp };
  });
  if (keyframes.length > MAX_KEYFRAMES) throw new Error("keyframes accepts at most " + MAX_KEYFRAMES + " items");
  if (source.reference_audios !== undefined && source.reference_audios !== null && !Array.isArray(source.reference_audios))
    throw new Error("reference_audios must be an array");
  const referenceAudios = (source.reference_audios || []).map(function (audio, index) {
    const object = plainObject(audio) || {};
    if (typeof object.voice_id === "string" && object.voice_id.trim()) return { voice_id: object.voice_id.trim() };
    if (typeof object.url === "string" && object.url.trim()) return { url: object.url.trim() };
    throw new Error("reference_audios[" + index + "] must be {voice_id} or {url}");
  });
  if (referenceAudios.length > MAX_REFERENCE_AUDIOS) throw new Error("reference_audios accepts at most " + MAX_REFERENCE_AUDIOS + " items");

  let action = "text_to_video";
  if (referenceImages.length || referenceAudios.length) action = "reference_to_video";
  else if (image || lastFrame || keyframes.length) action = "image_to_video";
  const prompt = promptField(source, action !== "image_to_video");

  const resolution = source.resolution === undefined || source.resolution === null ? DEFAULT_RESOLUTION : trimmed(source.resolution).toLowerCase();
  const resolutions = VIDEO_MODELS[model].resolutions;
  if (!resolutions.includes(resolution)) throw new Error(model + " resolution must be one of " + resolutions.join(", "));
  if (action === "reference_to_video" && resolution === "1080p") throw new Error("reference-to-video supports resolution 480p or 720p");
  const duration = source.duration === undefined || source.duration === null ? DEFAULT_DURATION : integerField(source.duration, "duration", 1, MAX_DURATION);

  const body = { duration: duration, resolution: resolution };
  if (prompt) body.prompt = prompt;
  if (source.aspect_ratio !== undefined && source.aspect_ratio !== null) {
    if (!ASPECT_RATIOS.includes(source.aspect_ratio)) throw new Error("aspect_ratio must be one of " + ASPECT_RATIOS.join(", "));
    body.aspect_ratio = source.aspect_ratio;
  }
  if (image) body.image = image;
  if (referenceImages.length) body.reference_images = referenceImages;
  if (lastFrame) body.last_frame = lastFrame;
  if (keyframes.length) body.keyframes = keyframes;
  if (referenceAudios.length) body.reference_audios = referenceAudios;
  if (source.generate_audio !== undefined && source.generate_audio !== null) {
    if (typeof source.generate_audio !== "boolean") throw new Error("generate_audio must be a boolean");
    body.generate_audio = source.generate_audio;
  }
  return { action: action, body: commonFields(source, body) };
}

// Edits and extensions take an input video; the output keeps its resolution
// and aspect ratio, so those fields are not forwarded.
function videoInputRequest(action, source, identity) {
  const model = videoModel(identity);
  if (!VIDEO_MODELS[model].videoInput) throw new Error("video editing and extension require grok-imagine-video");
  const body = { prompt: promptField(source, true), video: mediaInput(source.video, "video") };
  if (action === "video_extension") {
    body.duration =
      source.duration === undefined || source.duration === null
        ? DEFAULT_EXTENSION_SECONDS
        : integerField(source.duration, "duration", MIN_EXTENSION_SECONDS, MAX_EXTENSION_SECONDS);
  }
  return { action: action, body: commonFields(source, body) };
}

function videoRequest(action, source, identity) {
  if (action === "video_edit" || action === "video_extension") return videoInputRequest(action, source, identity);
  return generationRequest(generationSource(source), identity);
}

// OpenAI-style WIDTHxHEIGHT sizes select the nearest xAI aspect ratio and the
// resolution of the shorter side.
function sizeOptions(size) {
  const text = trimmed(size).toLowerCase();
  if (["480p", "720p", "1080p"].includes(text)) return { resolution: text };
  const parts = text.replace("*", "x").split("x");
  const width = Number(parts[0]);
  const height = Number(parts[1]);
  if (parts.length !== 2 || !(width > 0) || !(height > 0)) throw new Error("size must be WIDTHxHEIGHT or one of 480p, 720p, 1080p");
  let aspectRatio = ASPECT_RATIOS[0];
  let nearest = Infinity;
  for (const ratio of ASPECT_RATIOS) {
    const sides = ratio.split(":").map(Number);
    const distance = Math.abs(Math.log(width / height) - Math.log(sides[0] / sides[1]));
    if (distance < nearest) {
      nearest = distance;
      aspectRatio = ratio;
    }
  }
  const shorter = Math.min(width, height);
  return { aspect_ratio: aspectRatio, resolution: shorter >= 1080 ? "1080p" : shorter >= 720 ? "720p" : "480p" };
}

// Normalizes every request shape that reaches the driver: the canonical xAI
// body, OpenAI video fields (seconds, size, input_reference), and the legacy
// task shape (images, metadata) that host routes without a plugin decoder
// pass through. Explicit xAI fields win over metadata and size.
function generationSource(req) {
  const source = Object.assign(
    {},
    plainObject(req.metadata) || {},
    req.size === undefined || req.size === null || req.size === "" ? {} : sizeOptions(req.size),
  );
  for (const key of Object.keys(req)) {
    if (req[key] !== undefined && req[key] !== null && req[key] !== "") source[key] = req[key];
  }
  if (source.duration === undefined && source.seconds !== undefined) source.duration = source.seconds;
  if (source.image === undefined && source.input_reference !== undefined) source.image = source.input_reference;
  const images = Array.isArray(req.images) ? req.images : [];
  if (source.image === undefined && images.length === 1) source.image = images[0];
  if (source.reference_images === undefined && images.length > 1) source.reference_images = images;
  return source;
}

// A moderated output still reports done, with respect_moderation false and no URL.
function filteredOutput(data) {
  const video = plainObject(data) && data.status === "done" ? plainObject(data.video) : null;
  return Boolean(video && video.respect_moderation === false);
}

// xAI reports the amount it billed on every video result. A failed result it
// still billed is charged rather than refunded.
function chargedFailure(data) {
  const usage = plainObject(data) && data.status === "failed" ? plainObject(data.usage) : null;
  return Boolean(usage && Number(usage.cost_in_usd_ticks) > 0);
}

function moderationNotice(data) {
  if (filteredOutput(data)) return "The generated video was blocked by content moderation.";
  if (!chargedFailure(data)) return "";
  const error = plainObject(data.error);
  return error && trimmed(error.message) ? trimmed(error.message) : "The request was blocked by content moderation.";
}

function videoURL(data) {
  const video = plainObject(data) && data.status === "done" ? plainObject(data.video) : null;
  return video && video.respect_moderation !== false ? trimmed(video.url) : "";
}

function failureReason(data) {
  const error = plainObject(data && data.error);
  return error && trimmed(error.message) ? trimmed(error.message) : "video generation failed";
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

function responsesVideoText(ctx, task) {
  const notice = moderationNotice(task && task.data);
  if (notice) return notice;
  const artifact = ctx && ctx.artifacts && ctx.artifacts.video;
  const url = trimmed(artifact && artifact.url);
  if (!url) throw new Error("video artifact is unavailable");
  const escaped = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return '<video controls src="' + escaped + '"></video>';
}

function nativeRequest(ctx, action) {
  if (!ctx.body || ctx.body.kind !== "json") throw new Error("JSON body required");
  const body = plainObject(ctx.body.value);
  if (!body) throw new Error("request body must be an object");
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model) throw new Error("model is required");
  const request = videoRequest(action, body, { model: model });
  return { kind: "submit", model: model, action: request.action, requestBody: Object.assign(request.body, { model: model }) };
}

function nativeImageRequest(ctx, operation) {
  if (!ctx.body || ctx.body.kind !== "json") throw new Error("JSON body required");
  const body = plainObject(ctx.body.value);
  if (!body) throw new Error("request body must be an object");
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model) throw new Error("model is required");
  const request = imageRequest(operation, body, { model: model });
  return { kind: "submit", model: model, action: request.action, requestBody: Object.assign(request.body, { model: model }) };
}

export const native = {
  createImageGeneration: function (ctx) {
    return nativeImageRequest(ctx, "generate");
  },
  createImageEdit: function (ctx) {
    return nativeImageRequest(ctx, "edit");
  },
  createGeneration: function (ctx) {
    return nativeRequest(ctx, "generation");
  },
  createEdit: function (ctx) {
    return nativeRequest(ctx, "video_edit");
  },
  createExtension: function (ctx) {
    return nativeRequest(ctx, "video_extension");
  },
  imageCreated: function (ctx, task) {
    return { created: task.created_at, data: imageData(task.data) };
  },
  videoCreated: function (ctx, task) {
    return { request_id: task.task_id };
  },
  videoStatus: function (ctx, task) {
    const data = plainObject(task.data);
    // The poller can fail a task whose last snapshot was still pending.
    if (data && typeof data.status === "string" && !(task.status === "FAILURE" && data.status === "pending")) {
      const output = Object.assign({}, data);
      delete output.request_id;
      // The gateway's upstream cost is not the caller's price.
      delete output.usage;
      // A billed failure settled as charged. Report it in xAI's moderated
      // output shape so callers, including a downstream gateway running this
      // plugin, see a charged result without the upstream cost.
      if (task.status === "SUCCESS" && chargedFailure(data)) {
        output.status = "done";
        output.progress = 100;
        output.video = { respect_moderation: false };
      }
      return output;
    }
    if (task.status === "FAILURE") return { status: "failed", error: { code: "internal_error", message: task.fail_reason || "video generation failed" } };
    const progress = Number(String(task.progress || "0").replace("%", ""));
    return { status: "pending", progress: Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 99) : 0 };
  },
  error: function (ctx, error) {
    return { error: { code: error.code, message: error.message } };
  },
};

export function buildSubmitRequest(ctx) {
  if (ctx.action === "text_to_image" || ctx.action === "image_to_image") {
    const request = imageRequest(ctx.action === "image_to_image" ? "edit" : "generate", ctx.requestBody || {}, ctx);
    const paths = { image_to_image: "/v1/images/edits", text_to_image: "/v1/images/generations" };
    return {
      url: apiRoot(ctx) + paths[request.action],
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + ctx.apiKey },
      body: Object.assign({}, request.body, { model: ctx.upstreamModel || ctx.model }),
      action: request.action,
    };
  }
  const request = videoRequest(ctx.action, ctx.requestBody || {}, ctx);
  const paths = { video_edit: "/v1/videos/edits", video_extension: "/v1/videos/extensions" };
  return {
    url: apiRoot(ctx) + (paths[request.action] || "/v1/videos/generations"),
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + ctx.apiKey },
    body: Object.assign({}, request.body, { model: ctx.upstreamModel || ctx.model }),
    action: request.action,
  };
}

export function parseSubmitResponse(ctx, resp) {
  const body = plainObject(resp.body);
  // Image generation is synchronous: the response already contains the
  // image payloads, so no vendor task exists to poll.
  if (ctx.action === "text_to_image" || ctx.action === "image_to_image") {
    const error = body && plainObject(body.error);
    const usage = body && plainObject(body.usage);
    const charged = Boolean(usage && Number(usage.cost_in_usd_ticks) > 0);
    if (!body || (!Array.isArray(body.data) && !plainObject(body.data))) {
      // A blocked or failed generation xAI still billed settles as a charged
      // success with no payload, so the reservation is not refunded.
      if (!charged) {
        if (error && trimmed(error.message)) throw new Error(trimmed(error.message));
        throw new Error("xAI returned no image data");
      }
    }
    const taskId = trimmed(ctx.publicTaskId) || trimmed(body.request_id);
    if (!taskId) throw new Error("missing synchronous image request id");
    const images = imageData(body);
    return {
      taskId: taskId,
      taskData: body,
      immediate: { status: "SUCCESS", progress: "100%", url: images.length && images[0].url ? images[0].url : "" },
    };
  }
  const taskId = body && typeof body.request_id === "string" ? body.request_id.trim() : "";
  if (!taskId) throw new Error("xAI did not return a request_id");
  const result = { taskId: taskId, taskData: body };
  // The result reports only the total length, so completion needs the
  // extension length to derive the input video seconds.
  if (ctx.action === "video_extension") result.state = { extension_seconds: (ctx.requestBody || {}).duration || DEFAULT_EXTENSION_SECONDS };
  return result;
}

export function extractUsage(ctx) {
  if (ctx.action === "text_to_image" || ctx.action === "image_to_image") {
    const request = imageRequest(ctx.action === "image_to_image" ? "edit" : "generate", ctx.requestBody || {}, ctx);
    const body = request.body;
    // Legacy per-call prices scale with the number of output images only.
    if (ctx.usagePurpose === "billing_ratios") return { image_count: body.n };
    const inputImages = (body.image ? 1 : 0) + (body.images || []).length;
    const facts = { image_count: body.n, resolution: body.resolution, input_images: inputImages };
    if (IMAGE_MODELS[imageModel(ctx)].quality) facts.quality = imageServedQuality(body, request.action);
    return facts;
  }
  const request = videoRequest(ctx.action, ctx.requestBody || {}, ctx);
  const body = request.body;
  const videoInput = VIDEO_MODELS[videoModel(ctx)].videoInput;
  let facts;
  if (request.action === "video_edit") {
    // Input URLs expose neither duration nor resolution; reserve the
    // documented maximum and the resolution cap, and settle on the result.
    facts = { seconds: MAX_EDIT_SECONDS, resolution: EDIT_RESOLUTION_CAP, input_images: 0, input_video_seconds: MAX_EDIT_SECONDS };
  } else if (request.action === "video_extension") {
    facts = { seconds: body.duration, resolution: EDIT_RESOLUTION_CAP, input_images: 0, input_video_seconds: MAX_EXTENSION_INPUT_SECONDS };
  } else {
    const images = (body.image ? 1 : 0) + (body.reference_images || []).length + (body.last_frame ? 1 : 0) + (body.keyframes || []).length;
    facts = { seconds: body.duration, resolution: body.resolution, input_images: images, input_video_seconds: 0 };
  }
  // Legacy per-call prices scale with the output length only.
  if (ctx.usagePurpose === "billing_ratios") return { seconds: facts.seconds };
  if (!videoInput) delete facts.input_video_seconds;
  facts.moderated = false;
  return facts;
}

export function buildQueryRequest(ctx) {
  return {
    url: apiRoot(ctx) + "/v1/videos/" + encodeURIComponent(ctx.taskId),
    method: "GET",
    headers: { Accept: "application/json", Authorization: "Bearer " + ctx.apiKey },
  };
}

export function parseTaskResult(ctx, body, response) {
  const data = plainObject(body);
  // xAI answers 202 while the video renders.
  if (!data && response && response.status === 202) return { status: "IN_PROGRESS" };
  const status = data ? data.status : undefined;
  if (status === "pending") {
    const result = { status: "IN_PROGRESS" };
    const progress = Number(data.progress);
    if (progress > 0 && progress < 100) result.progress = progress + "%";
    return result;
  }
  // A moderated output is done without a video. xAI still bills it, and only
  // a SUCCESS task keeps its charge.
  if (status === "done") {
    const result = { status: "SUCCESS" };
    // An edit or extension is billed by the resolution of its output, which
    // only the file reveals; an unreadable file keeps the reserved cap.
    if ((ctx.action === "video_edit" || ctx.action === "video_extension") && videoURL(data)) {
      const resolution = outputResolution(videoURL(data));
      if (resolution) result.state = Object.assign({}, plainObject(ctx.state) || {}, { output_resolution: resolution });
    }
    return result;
  }
  if (status === "failed") return chargedFailure(data) ? { status: "SUCCESS" } : { status: "FAILURE", reason: failureReason(data) };
  if (status === "expired") return { status: "FAILURE", reason: "the video expired before it was retrieved" };
  return { status: "UNKNOWN", reason: "unrecognized status: " + String(status || "") };
}

export function extractUsageOnSubmit(ctx, body) {
  // Only image responses report their final payload count at submit; video
  // results are settled by extractUsageOnComplete.
  if (ctx.action !== "text_to_image" && ctx.action !== "image_to_image") return null;
  const count = imageUsageCount(plainObject(body) || {});
  return count ? { image_count: count } : null;
}

export function extractUsageOnComplete(task, result, body) {
  // Image responses have no task status: the completed body is the result.
  const taskAction = task && task.action;
  if (taskAction === "text_to_image" || taskAction === "image_to_image") {
    const count = imageUsageCount(plainObject(body) || {});
    return count ? { image_count: count } : {};
  }
  // Legacy ratio pricing calls this hook without a poll body.
  const data = plainObject(body);
  if (!data || typeof data.status !== "string") return null;
  const facts = {};
  if (filteredOutput(data) || chargedFailure(data)) facts.moderated = true;
  // The state this poll returned arrives with its result; earlier polls left
  // theirs on the task.
  const state = plainObject(result && result.plugin_state) || plainObject(task && task.state) || {};
  if (VIDEO_MODELS["grok-imagine-video"].resolutions.includes(state.output_resolution)) facts.resolution = state.output_resolution;
  const duration = Number(data.status === "done" && plainObject(data.video) ? data.video.duration : NaN);
  if (!(duration > 0)) return facts;
  const action = task && task.action;
  if (action === "video_edit") {
    facts.seconds = Math.min(duration, MAX_EDIT_SECONDS);
    facts.input_video_seconds = facts.seconds;
  } else if (action === "video_extension") {
    // The extension length was reserved as seconds; the rest of the output is
    // the input video.
    const extension = Number(state.extension_seconds);
    if (extension > 0) facts.input_video_seconds = Math.min(Math.max(duration - extension, 0), MAX_EXTENSION_INPUT_SECONDS);
  } else {
    facts.seconds = Math.min(duration, MAX_DURATION);
  }
  return facts;
}

// xAI bills the output of an edit or extension by its resolution but reports
// neither it nor the source's, so the output's MP4 header is read: the moov
// box, reached by stepping over the top-level boxes with ranged reads, holds a
// tkhd per track with the track's size.
const PROBE_READ_BYTES = 64 * 1024;
const PROBE_MAX_BYTES = 1024 * 1024; // the utils.fetch body limit
const PROBE_MAX_READS = 3; // utils.fetch allows 4 per hook call

function outputResolution(url) {
  try {
    const track = videoTrack(url);
    if (!track) return "";
    return Math.min(track.width, track.height) > 480 ? "720p" : "480p";
  } catch (_error) {
    return "";
  }
}

// Reads bytes [start, start + length) of the file. A server that ignores
// Range answers 200 with the whole file, bounded by the fetch body limit.
function readBytes(url, start, length) {
  const response = utils.fetch({ url: url, headers: { Range: "bytes=" + start + "-" + (start + length - 1) }, responseType: "bytes" });
  if (response.status !== 206 && response.status !== 200) throw new Error("HTTP " + response.status);
  let first = 0;
  if (response.status === 206) {
    const range = /^bytes (\d+)-/.exec(response.headers["Content-Range"] || "");
    first = range ? Number(range[1]) : start;
  }
  return { start: first, bytes: new Uint8Array(response.body) };
}

function be32(bytes, offset) {
  return bytes[offset] * 16777216 + bytes[offset + 1] * 65536 + bytes[offset + 2] * 256 + bytes[offset + 3];
}

// An ISO BMFF box header: a 32-bit size and a four-character type, with a
// 64-bit size following when the size is 1; a size of 0 reaches end.
function boxHeader(bytes, offset, end) {
  if (offset + 8 > end) return null;
  let size = be32(bytes, offset);
  let header = 8;
  if (size === 1) {
    if (offset + 16 > end) return null;
    size = be32(bytes, offset + 8) * 4294967296 + be32(bytes, offset + 12);
    header = 16;
  }
  const open = size === 0;
  if (open) size = end - offset;
  if (size < header) return null;
  return { type: String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]), size: size, header: header, open: open };
}

function videoTrack(url) {
  let reads = 0;
  let chunk = { start: 0, bytes: new Uint8Array(0) };
  const read = function (start, length) {
    if (reads >= PROBE_MAX_READS) throw new Error("too many reads");
    reads++;
    chunk = readBytes(url, start, length);
  };
  let offset = 0;
  for (let i = 0; i < 32; i++) {
    if (offset < chunk.start || offset + 16 > chunk.start + chunk.bytes.length) read(offset, PROBE_READ_BYTES);
    let local = offset - chunk.start;
    let box = local >= 0 ? boxHeader(chunk.bytes, local, chunk.bytes.length) : null;
    if (!box) return null;
    if (box.type !== "moov") {
      offset += box.size;
      continue;
    }
    if (box.open || local + box.size > chunk.bytes.length) {
      read(offset, box.open ? PROBE_MAX_BYTES : Math.min(box.size, PROBE_MAX_BYTES));
      local = offset - chunk.start;
      box = local >= 0 ? boxHeader(chunk.bytes, local, chunk.bytes.length) : null;
      if (!box) return null;
    }
    return moovVideoTrack(chunk.bytes, local + box.header, Math.min(local + box.size, chunk.bytes.length));
  }
  return null;
}

// The largest track with a size is the video; audio tracks have none.
function moovVideoTrack(bytes, start, end) {
  let best = null;
  let offset = start;
  while (true) {
    const box = boxHeader(bytes, offset, end);
    if (!box || offset + box.size > end) return best;
    if (box.type === "trak") {
      const track = trackSize(bytes, offset + box.header, offset + box.size);
      if (track && (!best || track.width * track.height > best.width * best.height)) best = track;
    }
    offset += box.size;
  }
}

// tkhd stores the track's width and height as 16.16 fixed-point numbers after
// fields whose size depends on its version.
function trackSize(bytes, start, end) {
  let offset = start;
  while (true) {
    const box = boxHeader(bytes, offset, end);
    if (!box || offset + box.size > end) return null;
    if (box.type === "tkhd") {
      const fields = offset + box.header;
      const width = fields + 4 + (bytes[fields] === 1 ? 84 : 72);
      if (width + 8 > offset + box.size) return null;
      const track = { width: bytes[width] * 256 + bytes[width + 1], height: bytes[width + 4] * 256 + bytes[width + 5] };
      return track.width > 0 && track.height > 0 ? track : null;
    }
    offset += box.size;
  }
}

export function listArtifacts(task) {
  return task.status === "SUCCESS" && videoURL(task.data) ? [{ key: "video", type: "video", mimeType: "video/mp4" }] : [];
}

export function buildContentRequest(ctx) {
  if (ctx.artifactKey !== "video") throw new Error("artifact_not_found");
  const url = videoURL(ctx.data);
  if (!url) throw new Error("artifact_not_found");
  return { url: url, method: ctx.clientRequest.method, credentialless: true };
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
      const images = [];
      for (const image of [req.image, req.input_reference].concat(req.images || [], input.images)) {
        if (typeof image === "string" && image.trim() && !images.includes(image.trim())) images.push(image.trim());
      }
      // metadata carries xAI-only fields such as keyframes or generate_audio.
      const source = { prompt: input.prompt || trimmed(req.prompt), images: images };
      for (const key of ["metadata", "seconds", "duration", "size", "aspect_ratio", "resolution"]) {
        if (req[key] !== undefined) source[key] = req[key];
      }
      if (!source.prompt && !images.length) throw new Error("input is required");
      const request = videoRequest("generation", source, { upstreamModel: ctx.upstreamModel, model: model });
      return { kind: "submit", model: model, action: request.action, requestBody: Object.assign(request.body, { model: model }) };
    },
    renderEvents: function (ctx, task, previousState) {
      const status = String(task.status || "UNKNOWN").toUpperCase();
      const value = Number(String(task.progress || "").replace("%", ""));
      const progress = Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
      const state = { status: status, progress: progress };
      if (status === "SUCCESS") {
        const text = responsesVideoText(ctx, task);
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
    renderFinal: function (ctx, task) {
      return {
        output: [
          {
            type: "message",
            status: "completed",
            role: "assistant",
            content: [{ type: "output_text", text: responsesVideoText(ctx, task), annotations: [], logprobs: [] }],
          },
        ],
        metadata: { vendor: "xai" },
      };
    },
  },
  // OpenAI Images API. xAI answers synchronously, so parseSubmitResponse
  // returns a terminal result and the host renders data[] inline.
  openai_image: {
    decodeRequest: function (ctx) {
      if (!ctx.body || (ctx.body.kind !== "json" && ctx.body.kind !== "multipart")) throw new Error("JSON or multipart body required");
      const operation = ctx.operation === "edit" ? "edit" : "generate";
      let source;
      if (ctx.body.kind === "json") {
        source = plainObject(ctx.body.value);
        if (!source) throw new Error("request body must be an object");
      } else {
        source = multipartImageSource(ctx, operation);
      }
      const model = trimmed(ctx.model) || trimmed(source.model);
      if (!model) throw new Error("model is required");
      const request = imageRequest(operation, source, { upstreamModel: ctx.upstreamModel, model: model });
      // The host owns response_format: it returns URLs and inlines base64 on
      // request, so the upstream response stays in one shape.
      delete request.body.response_format;
      return { kind: "submit", model: model, action: request.action, requestBody: Object.assign(request.body, { model: model }) };
    },
    // The host owns created and response_format; the plugin returns the
    // validated image payloads only, never the upstream cost.
    render: function (ctx, task) {
      return { data: imageData(task.data) };
    },
  },
  openai_video: {
    decodeRequest: function (ctx) {
      if (!ctx.body || (ctx.body.kind !== "json" && ctx.body.kind !== "multipart")) throw new Error("JSON or multipart body required");
      let req;
      if (ctx.body.kind === "json") {
        req = plainObject(ctx.body.value);
        if (!req) throw new Error("JSON object required");
      } else {
        req = {};
        const fields = ctx.body.fields || {};
        for (const name of Object.keys(fields)) {
          if (fields[name].length > 1) throw new Error(name + " must be provided once");
          req[name] = fields[name][0];
        }
        if (req.generate_audio !== undefined) {
          if (req.generate_audio !== "true" && req.generate_audio !== "false") throw new Error("generate_audio must be true or false");
          req.generate_audio = req.generate_audio === "true";
        }
        const files = ctx.body.files || [];
        for (const file of files) {
          if (file.field !== "input_reference") throw new Error("unexpected file field: " + file.field);
        }
        if (files.length > 1) throw new Error("input_reference must be provided once");
        if (files.length) req.input_reference = { url: { __fileRef: files[0].ref, encoding: "dataUrl" } };
      }
      const request = videoRequest("generation", req, { upstreamModel: ctx.upstreamModel, model: ctx.model });
      return { kind: "submit", model: ctx.model, action: request.action, requestBody: Object.assign(request.body, { model: ctx.model }) };
    },
    // The host owns id, status, progress, and timestamps; a moderated video
    // reports completed (it is charged) and explains the missing content here.
    render: function (ctx, task) {
      const data = plainObject(task.data) || {};
      const output = { object: "video" };
      const seconds = Number(plainObject(data.video) ? data.video.duration : NaN);
      if (seconds > 0) output.seconds = String(seconds);
      const notice = task.status === "SUCCESS" ? moderationNotice(data) : "";
      if (notice) output.error = { code: "moderation_blocked", message: notice };
      if (task.status === "FAILURE")
        output.error = {
          code: trimmed(plainObject(data.error) && data.error.code) || "video_generation_failed",
          message: task.fail_reason || failureReason(data),
        };
      return output;
    },
  },
};
