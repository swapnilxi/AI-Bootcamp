export type VideoSource =
  | { kind: "embed"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

/** Turn a YouTube / Vimeo / direct video URL into something we can render. */
export function parseVideoUrl(url: string): VideoSource {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/)?.[2];
      if (id) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      if (id) return { kind: "embed", src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) {
      return { kind: "file", src: url };
    }
  } catch {
    // fall through to a plain link
  }
  return { kind: "link", src: url };
}
