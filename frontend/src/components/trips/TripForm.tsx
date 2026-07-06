import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadFile, type TripDetail, type TripPayload } from "../../api/trips";
import { formatMoney, resolveAssetUrl } from "./tripFormatting";

const tripSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(150, "Title is too long."),
    destination: z.string().trim().min(1, "Destination is required.").max(150, "Destination is too long."),
    description: z.string().max(2000, "Description is too long.").optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    coverImageUrl: z.string().max(2048, "Cover image URL is too long.").optional(),
    currencyCode: z.string().trim().min(3, "Currency is required.").max(3, "Currency must be a 3-letter code."),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "End date must be on or after start date.",
  });

type TripFormValues = z.infer<typeof tripSchema>;

type TripFormProps = {
  trip?: TripDetail;
  submitLabel: string;
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: TripPayload) => Promise<void>;
};

export function TripForm({ trip, submitLabel, isSaving, serverError, onSubmit }: TripFormProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const coverFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startY: number; startPositionY: number } | null>(null);
  const { register, handleSubmit, setError, setValue, watch, formState: { errors } } = useForm<TripFormValues>({ defaultValues: { title: trip?.title ?? "", destination: trip?.destination ?? "", description: trip?.description ?? "", startDate: trip?.startDate ?? "", endDate: trip?.endDate ?? "", coverImageUrl: trip?.coverImageUrl ?? "", currencyCode: trip?.currencyCode ?? "VND" } });

  const coverImageUrl = watch("coverImageUrl") || null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(resolveAssetUrl(coverImageUrl));

  useEffect(() => {
    if (coverFile) {
      const objectUrl = URL.createObjectURL(coverFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setPreviewUrl(resolveAssetUrl(coverImageUrl));
  }, [coverFile, coverImageUrl]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId || !coverFrameRef.current) {
        return;
      }

      const frame = coverFrameRef.current.getBoundingClientRect();
      const deltaY = event.clientY - dragState.startY;
      const nextPositionY = dragState.startPositionY + (deltaY / frame.height) * 100;
      setCoverPositionY(Math.max(0, Math.min(100, nextPositionY)));
      event.preventDefault();
    }

    function onPointerUp(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      dragStateRef.current = null;
      setIsCoverDragging(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  async function handleFormSubmit(values: TripFormValues) {
    setUploadError(null);
    const parsedValues = tripSchema.safeParse(values);

    if (!parsedValues.success) {
      for (const issue of parsedValues.error.issues) {
        const fieldName = issue.path[0] as keyof TripFormValues;
        setError(fieldName, { message: issue.message });
      }
      return;
    }

    let finalCoverImageUrl = parsedValues.data.coverImageUrl?.trim() || null;

    if (coverFile) {
      setIsUploading(true);
      try {
        finalCoverImageUrl = await uploadFile(coverFile, "TripCover");
        setValue("coverImageUrl", finalCoverImageUrl);
      } catch {
        setUploadError("Cover image upload failed.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    await onSubmit({
      title: parsedValues.data.title.trim(),
      destination: parsedValues.data.destination.trim(),
      description: parsedValues.data.description?.trim() || null,
      startDate: parsedValues.data.startDate || null,
      endDate: parsedValues.data.endDate || null,
      coverImageUrl: finalCoverImageUrl,
      currencyCode: parsedValues.data.currencyCode.trim().toUpperCase(),
    });
  }

  return (
    <form className="space-y-5 rounded border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(handleFormSubmit)}>
      {serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
      {uploadError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium sm:col-span-2">
          Title
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="text" placeholder="Summer in Kyoto" {...register("title")} />
          {errors.title ? <span className="mt-1 block text-sm text-red-600">{errors.title.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Currency
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2 uppercase" type="text" maxLength={3} placeholder="VND" {...register("currencyCode")} />
          {errors.currencyCode ? <span className="mt-1 block text-sm text-red-600">{errors.currencyCode.message}</span> : null}
        </label>
        <label className="block text-sm font-medium sm:col-span-3">
          Destination
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="text" placeholder="Kyoto, Japan" {...register("destination")} />
          {errors.destination ? <span className="mt-1 block text-sm text-red-600">{errors.destination.message}</span> : null}
        </label>
      </div>

      <label className="block text-sm font-medium">
        Description
        <textarea className="mt-1 min-h-28 w-full rounded border border-stone-300 px-3 py-2" placeholder="Notes, goals, or context for this trip" {...register("description")} />
        {errors.description ? <span className="mt-1 block text-sm text-red-600">{errors.description.message}</span> : null}
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-700">Round trip dates</p>
        <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
          <div className="grid gap-px bg-stone-200 sm:grid-cols-[1fr_auto_1fr]">
            <label className="flex flex-col gap-2 bg-white px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Depart</span>
              <input className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none ring-0 placeholder:text-stone-400 focus:ring-0" type="date" {...register("startDate")} />
              {errors.startDate ? <span className="text-sm text-red-600">{errors.startDate.message}</span> : <span className="text-xs text-stone-400">Trip start</span>}
            </label>

            <div className="flex items-center justify-center bg-stone-50 px-3 py-3 text-stone-400 sm:min-w-16">
              <div className="text-center">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Trip</div>
                <div className="text-lg leading-none">?</div>
              </div>
            </div>

            <label className="flex flex-col gap-2 bg-white px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Return</span>
              <input className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none ring-0 placeholder:text-stone-400 focus:ring-0" type="date" {...register("endDate")} />
              {errors.endDate ? <span className="text-sm text-red-600">{errors.endDate.message}</span> : <span className="text-xs text-stone-400">Trip end</span>}
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-700">Cover image</p>
        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-stone-100 shadow-sm">
          <div
            ref={coverFrameRef}
            className={`relative aspect-[3/1] min-h-52 ${previewUrl ? (isCoverDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
            style={{ touchAction: "none" }}
            onPointerDown={(event) => {
              if (!previewUrl || !coverFrameRef.current || event.button !== 0 || event.target !== event.currentTarget) {
                return;
              }

              setIsCoverDragging(true);
              dragStateRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startPositionY: coverPositionY,
              };
              (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              if (dragStateRef.current?.pointerId === event.pointerId) {
                dragStateRef.current = null;
              }
            }}
          >
            {previewUrl ? (
              <img className="h-full w-full object-cover" style={{ objectPosition: `center ${coverPositionY}%` }} src={previewUrl} alt="Trip cover preview" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 via-white to-stone-200 text-center">
                <div className="max-w-sm px-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Cover photo</div>
                  <div className="mt-2 text-lg font-semibold text-ink">Add a wide image for the trip header</div>
                  <div className="mt-1 text-sm text-stone-500">Use a landscape photo so the cover feels native and polished.</div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 text-white sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">Update cover</div>
                <div className="mt-1 text-sm text-white/90">Choose a new photo or replace the current trip cover.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-stone-100">
                  {coverFile ? "Change photo" : "Select photo"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      setCoverFile(event.target.files?.[0] ?? null);
                      setIsCoverMenuOpen(false);
                    }}
                  />
                </label>
                {coverFile ? (
                  <button
                    className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                    type="button"
                    onClick={() => setCoverFile(null)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <div className="absolute right-4 top-4">
              <button
                className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
                type="button"
                onClick={() => setIsCoverMenuOpen((value) => !value)}
              >
                {isCoverMenuOpen ? "Close" : "Cover options"}
              </button>
              {isCoverMenuOpen ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                  <label className="flex cursor-pointer items-center px-4 py-3 text-sm font-medium text-ink hover:bg-stone-50">
                    Upload new photo
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        setCoverFile(event.target.files?.[0] ?? null);
                        setIsCoverMenuOpen(false);
                      }}
                    />
                  </label>
                  <button
                    className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-ink hover:bg-stone-50 disabled:text-stone-400"
                    type="button"
                    disabled={!coverFile}
                    onClick={() => {
                      setCoverFile(null);
                      setIsCoverMenuOpen(false);
                    }}
                  >
                    Remove selected photo
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <input type="hidden" {...register("coverImageUrl")} />
      </div>

      <button className="rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={isSaving || isUploading}>
        {isUploading ? "Uploading..." : isSaving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
