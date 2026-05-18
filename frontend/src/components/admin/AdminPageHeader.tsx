export default function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="text-xl font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-2xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm font-light text-zinc-600">{description}</p>
      ) : null}
    </header>
  );
}
