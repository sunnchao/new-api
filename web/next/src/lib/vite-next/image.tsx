import { forwardRef, type ImgHTMLAttributes } from "react";

type StaticImageData = {
  src: string;
  width?: number;
  height?: number;
};

export type ImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height" | "loading"
> & {
  src: string | StaticImageData;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
  quality?: number | `${number}`;
  placeholder?: "blur" | "empty" | `data:image/${string}`;
  blurDataURL?: string;
  loading?: "eager" | "lazy";
};

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    src,
    width,
    height,
    fill,
    priority,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    alt,
    style,
    loading,
    ...props
  },
  ref
) {
  void _quality;
  void _placeholder;
  void _blurDataURL;

  const resolvedSrc = typeof src === "string" ? src : src.src;
  const resolvedWidth = width ?? (typeof src === "string" ? undefined : src.width);
  const resolvedHeight = height ?? (typeof src === "string" ? undefined : src.height);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : resolvedWidth}
      height={fill ? undefined : resolvedHeight}
      loading={priority ? "eager" : loading}
      style={{
        ...style,
        ...(fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }
          : null),
      }}
      {...props}
    />
  );
});

export default Image;
