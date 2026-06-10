import {
  lazy,
  Suspense,
  type ComponentType,
  type ReactNode,
} from "react";

type LoaderComponent<P> =
  | ComponentType<P>
  | {
      default: ComponentType<P>;
    };

type DynamicLoader<P> = () => Promise<LoaderComponent<P>>;

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => ReactNode;
};

export default function dynamic<P extends object>(
  loader: DynamicLoader<P>,
  options: DynamicOptions = {}
) {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    if ("default" in loaded) return loaded;
    return { default: loaded };
  });

  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={options.loading?.() ?? null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
