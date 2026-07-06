import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveAssetUrl } from "./tripFormatting";

type TripStepImageCarouselProps = {
  imageUrls: string[];
  altPrefix?: string;
  className?: string;
  variant?: "default" | "compact";
};

export function TripStepImageCarousel({ imageUrls, altPrefix = "Step image", className = "", variant = "default" }: TripStepImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompact = variant === "compact";

  useEffect(() => {
    if (activeIndex >= imageUrls.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, imageUrls.length]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isExpanded]);

  if (imageUrls.length === 0) {
    return null;
  }

  const resolvedUrls = imageUrls.map((url) => resolveAssetUrl(url) ?? url);
  const activeUrl = resolvedUrls[activeIndex] ?? resolvedUrls[0];

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + resolvedUrls.length) % resolvedUrls.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % resolvedUrls.length);
  }

  return (
    <>
      <div className={className}>
        <div className={`relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm ${isCompact ? "" : ""}`}>
          <button
            type="button"
            className="group relative block w-full cursor-zoom-in overflow-hidden text-left"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand step images"
          >
            <div className={`relative w-full ${isCompact ? "aspect-[4/3]" : "aspect-[16/9]"}`}>
              <img className="h-full w-full object-cover" src={activeUrl} alt={`${altPrefix} ${activeIndex + 1}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
              <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 text-white ${isCompact ? "p-3" : "p-4"}`}>
                <div>
                  <p className={`mt-1 text-white/90 ${isCompact ? "text-xs" : "text-sm"}`}>
                    {imageUrls.length} {imageUrls.length === 1 ? "photo" : "photos"}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full bg-white/15 font-semibold backdrop-blur ${isCompact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"}`}>
                  <Maximize2 size={isCompact ? 12 : 14} aria-hidden="true" />
                  View all
                </span>
              </div>
            </div>
          </button>

          {resolvedUrls.length > 1 ? (
            <>
              <button
                type="button"
                className={`absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white ${isCompact ? "p-1.5" : "p-2"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft size={isCompact ? 16 : 18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white ${isCompact ? "p-1.5" : "p-2"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight size={isCompact ? 16 : 18} aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>

        {resolvedUrls.length > 1 ? (
          <div className={`mt-3 flex gap-2 overflow-x-auto pb-1 ${isCompact ? "" : ""}`}>
            {resolvedUrls.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                className={`shrink-0 overflow-hidden rounded-lg border transition ${isCompact ? "h-12 w-12" : "h-16 w-16"} ${index === activeIndex ? "border-coast ring-2 ring-coast/20" : "border-stone-200 hover:border-stone-300"
                  }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}`}
              >
                <img className="h-full w-full object-cover" src={url} alt={`${altPrefix} thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Step images"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Step images</p>
                <p className="mt-1 text-sm text-stone-600">
                  {activeIndex + 1} of {resolvedUrls.length}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-ink"
                onClick={() => setIsExpanded(false)}
                aria-label="Close images"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="relative overflow-hidden rounded-2xl bg-stone-100">
                <div className="relative aspect-[16/10]">
                  <img className="h-full w-full object-contain bg-black" src={activeUrl} alt={`${altPrefix} ${activeIndex + 1}`} />
                </div>
                {resolvedUrls.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ink shadow-sm backdrop-blur transition hover:bg-white"
                      onClick={showPrevious}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ink shadow-sm backdrop-blur transition hover:bg-white"
                      onClick={showNext}
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>

              <div className="space-y-4 overflow-hidden">
                <div>
                  <h3 className="text-base font-semibold text-ink">All images</h3>
                  <p className="mt-1 text-sm text-stone-600">Click any image to jump to it.</p>
                </div>
                <div className="max-h-[60vh] overflow-auto pr-1">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {resolvedUrls.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        className={`overflow-hidden rounded-2xl border text-left transition ${index === activeIndex ? "border-coast ring-2 ring-coast/20" : "border-stone-200 hover:border-stone-300"
                          }`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Show image ${index + 1}`}
                      >
                        <div className="aspect-square bg-stone-100">
                          <img className="h-full w-full object-cover" src={url} alt={`${altPrefix} grid ${index + 1}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
