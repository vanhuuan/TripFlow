type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-coast">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base text-stone-600">{description}</p>
    </div>
  );
}
