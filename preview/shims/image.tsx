/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "placeholder"> & { src: string | { src: string }; fill?: boolean; priority?: boolean; sizes?: string; placeholder?: string };

/** Minimal stand-in for next/image in the preview build. */
export default function Image({ src, fill, priority, style, placeholder: _placeholder, alt = "", ...rest }: Props) {
  const s: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style ?? {};
  void _placeholder;
  return <img {...rest} alt={alt} src={typeof src === "string" ? src : src.src} style={s} loading={priority ? "eager" : "lazy"} decoding="async" />;
}
