import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { uploadFile, type TripDetail, type TripMemberPayload, type TripPayload } from "../../api/trips";
import { useI18n } from "../../i18n";
import { resolveAssetUrl } from "./tripFormatting";
import { z } from "zod";

type TripFormProps = {
  trip?: TripDetail;
  submitLabel: string;
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: TripPayload) => Promise<void>;
};

export function TripForm({ trip, submitLabel, isSaving, serverError, onSubmit }: TripFormProps) {
  const { t } = useI18n();
  const tripSchema = z
    .object({
      title: z.string().trim().min(1, "Tiêu đề là bắt buộc.").max(150, "Tiêu đề quá dài."),
      destination: z.string().trim().min(1, "Điểm đến là bắt buộc.").max(150, "Điểm đến quá dài."),
      description: z.string().max(2000, "Mô tả quá dài.").optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      coverImageUrl: z.string().max(2048, "URL ảnh bìa quá dài.").optional(),
      currencyCode: z.string().trim().min(3, "Tiền tệ là bắt buộc.").max(3, "Tiền tệ phải là mã 3 ký tự."),
    })
    .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
      path: ["endDate"],
      message: "Ngày kết thúc phải không sớm hơn ngày bắt đầu.",
    });
  type TripFormValues = z.infer<typeof tripSchema>;

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [members, setMembers] = useState<TripMemberPayload[]>(trip?.members.map((member) => ({ id: member.id, name: member.name })) ?? []);
  const coverFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startY: number; startPositionY: number } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormValues>({
    defaultValues: {
      title: trip?.title ?? "",
      destination: trip?.destination ?? "",
      description: trip?.description ?? "",
      startDate: trip?.startDate ?? "",
      endDate: trip?.endDate ?? "",
      coverImageUrl: trip?.coverImageUrl ?? "",
      currencyCode: trip?.currencyCode ?? "VND",
    },
  });

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
        setUploadError(t("common.coverImageUploadFailed"));
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
      members: members.map((member) => ({ id: member.id, name: member.name.trim() })).filter((member) => member.name.length > 0),
    });
  }

  return (
    <form className="surface-card space-y-6 p-5 sm:p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      {serverError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p> : null}
      {uploadError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium sm:col-span-2">
          {t("forms.title")}
          <input className="form-input mt-1.5" type="text" placeholder="Summer in Kyoto" {...register("title")} />
          {errors.title ? <span className="mt-1.5 block text-sm text-red-600">{errors.title.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("forms.currency")}
          <input className="form-input mt-1.5 uppercase" type="text" maxLength={3} placeholder="VND" {...register("currencyCode")} />
          {errors.currencyCode ? <span className="mt-1.5 block text-sm text-red-600">{errors.currencyCode.message}</span> : null}
        </label>
        <label className="block text-sm font-medium sm:col-span-3">
          {t("forms.destination")}
          <input className="form-input mt-1.5" type="text" placeholder="Kyoto, Japan" {...register("destination")} />
          {errors.destination ? <span className="mt-1.5 block text-sm text-red-600">{errors.destination.message}</span> : null}
        </label>
      </div>

      <label className="block text-sm font-medium">
        {t("forms.description")}
        <textarea className="form-input mt-1.5 min-h-28 resize-y" placeholder="Notes, goals, or context for this trip" {...register("description")} />
        {errors.description ? <span className="mt-1.5 block text-sm text-red-600">{errors.description.message}</span> : null}
      </label>


      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-700">Trip members</p>
            <p className="mt-1 text-xs text-stone-500">Add people who can join steps and share bills.</p>
          </div>
          <button
            className="button-secondary pressable px-3 py-2 text-sm active:scale-[0.96]"
            type="button"
            onClick={() => setMembers((current) => [...current, { id: null, name: "" }])}
          >
            Add member
          </button>
        </div>
        {members.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-500">No trip members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member, index) => (
              <div key={member.id ?? `new-${index}`} className="flex gap-2">
                <input
                  className="form-input"
                  type="text"
                  value={member.name}
                  placeholder={`Member ${index + 1}`}
                  onChange={(event) => setMembers((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)))}
                />
                <button
                  className="button-ghost pressable shrink-0 px-3 py-2 text-sm active:scale-[0.96]"
                  type="button"
                  onClick={() => setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        <p className="text-sm font-semibold text-stone-700">{t("forms.roundTripDates")}</p>
        <div className="overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white shadow-sm">
          <div className="grid gap-px bg-stone-200 sm:grid-cols-[1fr_auto_1fr]">
            <label className="flex flex-col gap-2 bg-white px-4 py-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("forms.depart")}</span>
              <input className="border-0 bg-transparent p-0 text-base text-ink outline-none ring-0 placeholder:text-stone-400 focus:ring-0" type="date" {...register("startDate")} />
              {errors.startDate ? <span className="text-sm text-red-600">{errors.startDate.message}</span> : <span className="text-xs text-stone-400">{t("forms.tripStart")}</span>}
            </label>

            <div className="flex items-center justify-center bg-stone-50 px-3 py-3 text-stone-400 sm:min-w-16">
              <div className="text-center">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Trip</div>
                <div className="text-lg leading-none">?</div>
              </div>
            </div>

            <label className="flex flex-col gap-2 bg-white px-4 py-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("forms.return")}</span>
              <input className="border-0 bg-transparent p-0 text-base text-ink outline-none ring-0 placeholder:text-stone-400 focus:ring-0" type="date" {...register("endDate")} />
              {errors.endDate ? <span className="text-sm text-red-600">{errors.endDate.message}</span> : <span className="text-xs text-stone-400">{t("forms.tripEnd")}</span>}
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-semibold text-stone-700">{t("forms.coverImage")}</p>
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100 shadow-sm">
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
              <img className="image-outline h-full w-full object-cover" style={{ objectPosition: `center ${coverPositionY}%` }} src={previewUrl} alt={t("forms.coverPhoto")} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 via-white to-stone-200 text-center">
                <div className="max-w-sm px-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">{t("forms.coverPhoto")}</div>
                  <div className="mt-2 text-lg font-semibold text-ink">{t("forms.addWideImage")}</div>
                  <div className="mt-1 text-sm text-stone-500">{t("forms.useLandscapePhoto")}</div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 text-white sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">{t("forms.updateCover")}</div>
                <div className="mt-1 text-sm text-white/90">{t("forms.chooseNewPhoto")}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="pressable inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-stone-100">
                  {coverFile ? t("forms.changePhoto") : t("forms.selectPhoto")}
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
                    className="pressable rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                    type="button"
                    onClick={() => setCoverFile(null)}
                  >
                    {t("forms.remove")}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="absolute right-4 top-4">
              <button
                className="pressable inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur hover:bg-white"
                type="button"
                onClick={() => setIsCoverMenuOpen((value) => !value)}
              >
                {isCoverMenuOpen ? t("forms.remove") : t("forms.coverOptions")}
              </button>
              {isCoverMenuOpen ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                  <label className="flex cursor-pointer items-center px-4 py-3 text-sm font-medium text-ink hover:bg-stone-50">
                    {t("forms.uploadNewPhoto")}
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
                    {t("forms.removeSelectedPhoto")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <input type="hidden" {...register("coverImageUrl")} />
      </div>

      <button className="button-primary pressable active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving || isUploading}>
        {isUploading ? t("forms.uploading") : isSaving ? t("forms.saving") : submitLabel}
      </button>
    </form>
  );
}

