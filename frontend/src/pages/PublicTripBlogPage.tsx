import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicTripBlog, type PublicTripBlog } from "../api/blogs";
import { BlogArticle } from "../components/blogs/BlogArticle";
import { PageHeader } from "../components/PageHeader";
import { useI18n } from "../i18n";

export function PublicTripBlogPage() {
  const { token } = useParams();
  const { t } = useI18n();
  const [blog, setBlog] = useState<PublicTripBlog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    let active = true;
    getPublicTripBlog(token)
      .then((loaded) => { if (active) setBlog(loaded); })
      .catch(() => { if (active) setBlog(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (isLoading) return <div className="mx-auto max-w-5xl rounded-3xl bg-white/90 px-5 py-4 text-sm text-stone-600 shadow-sm">{t("blog.loadingPublic")}</div>;
  if (!blog) {
    return (
      <section className="mx-auto max-w-5xl space-y-6">
        <PageHeader eyebrow={t("blog.publicEyebrow")} title={t("blog.notFoundTitle")} description={t("blog.notFoundDescription")} />
        <Link className="button-primary pressable" to="/">{t("nav.home")}</Link>
      </section>
    );
  }

  const publishedLabel = `${t("blog.publishedOn")} ${new Intl.DateTimeFormat(blog.locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "long" }).format(new Date(blog.publishedAt))}`;
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-stone-600"><BookOpen size={17} aria-hidden="true" />{t("blog.publicEyebrow")}</div>
      <BlogArticle content={blog.content} locale={blog.locale} publishedLabel={publishedLabel} />
    </section>
  );
}
