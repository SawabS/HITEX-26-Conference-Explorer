export function ViewSkeleton() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-10 md:px-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-4 h-10 w-[min(520px,90%)]" />
      <div className="skeleton mt-8 h-12 w-full" />
      <div className="skeleton mt-4 h-64 w-full" />
    </div>
  );
}
