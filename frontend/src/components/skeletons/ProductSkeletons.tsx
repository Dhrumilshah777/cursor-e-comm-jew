type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-zinc-200/90 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3" aria-hidden="true">
      <SkeletonBlock className="aspect-square w-full rounded-none bg-zinc-100" />
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-[85%]" />
        <SkeletonBlock className="h-2.5 w-[55%] bg-zinc-100" />
        <SkeletonBlock className="h-3 w-[35%]" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  showToolbar = true,
}: {
  count?: number;
  showToolbar?: boolean;
}) {
  return (
    <section
      className="w-full bg-white py-10 sm:py-12 lg:py-16"
      aria-busy="true"
      aria-label="Loading products"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <SkeletonBlock className="mx-auto h-8 w-40 sm:h-10 sm:w-52 lg:h-12 lg:w-64" />
          <div className="mt-4 flex items-center justify-center gap-2">
            <SkeletonBlock className="h-2.5 w-10 bg-zinc-100" />
            <SkeletonBlock className="h-2.5 w-2 bg-zinc-100" />
            <SkeletonBlock className="h-2.5 w-16 bg-zinc-100" />
          </div>
        </div>

        {showToolbar ? (
          <div className="mt-8 flex gap-3 sm:mt-10">
            <SkeletonBlock className="h-11 flex-1 sm:min-w-[148px] sm:flex-none sm:w-36" />
            <SkeletonBlock className="h-11 flex-1 sm:min-w-[148px] sm:flex-none sm:w-36" />
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-5">
          {Array.from({ length: count }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CollectionPageSkeleton() {
  return (
    <>
      <section
        className="relative w-full overflow-hidden bg-zinc-100"
        aria-hidden="true"
      >
        <SkeletonBlock className="aspect-[2/1] w-full rounded-none sm:aspect-[3/1] lg:aspect-[4/1] bg-zinc-200" />
      </section>
      <ProductGridSkeleton />
    </>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="bg-white" aria-busy="true" aria-label="Loading product">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-2.5 w-10 bg-zinc-100" />
          <SkeletonBlock className="h-2.5 w-2 bg-zinc-100" />
          <SkeletonBlock className="h-2.5 w-14 bg-zinc-100" />
          <SkeletonBlock className="h-2.5 w-2 bg-zinc-100" />
          <SkeletonBlock className="h-2.5 w-24 bg-zinc-100" />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <SkeletonBlock className="aspect-square w-full rounded-none bg-zinc-100 lg:max-h-[640px]" />

          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-3 w-28 bg-zinc-100" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-9 rounded-full bg-zinc-100" />
                <SkeletonBlock className="h-9 w-9 rounded-full bg-zinc-100" />
              </div>
            </div>
            <SkeletonBlock className="mt-4 h-8 w-[85%] sm:h-9" />
            <SkeletonBlock className="mt-4 h-6 w-24" />
            <SkeletonBlock className="mt-2 h-3 w-32 bg-zinc-100" />

            <div className="mt-6 space-y-2">
              <SkeletonBlock className="h-3 w-full bg-zinc-100" />
              <SkeletonBlock className="h-3 w-full bg-zinc-100" />
              <SkeletonBlock className="h-3 w-[70%] bg-zinc-100" />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-xl">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-12 bg-zinc-100" />
                  <SkeletonBlock className="h-4 w-16" />
                </div>
              ))}
            </div>

            <SkeletonBlock className="mt-8 h-12 w-full sm:w-48" />

            <div className="mt-10 space-y-3 border-t border-zinc-100 pt-8">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-3 w-full bg-zinc-100" />
              <SkeletonBlock className="h-3 w-full bg-zinc-100" />
              <SkeletonBlock className="h-3 w-4/5 bg-zinc-100" />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-zinc-100 pt-10 sm:mt-16">
          <SkeletonBlock className="mx-auto h-4 w-40" />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5">
            {Array.from({ length: 4 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
