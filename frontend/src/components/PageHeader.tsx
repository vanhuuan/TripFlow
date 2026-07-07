type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coast">{eyebrow}</p>
      <h1 className="text-balance text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      <p className="max-w-2xl text-pretty text-base leading-7 text-stone-600">{description}</p>
    </div>
  );
}
