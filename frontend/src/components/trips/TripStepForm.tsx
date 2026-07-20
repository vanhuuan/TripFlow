import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { uploadFile, type TripMember, type TripStep, type TripStepPayload, type TripStepType } from "../../api/trips";
import { useI18n, getStepTypeOptions } from "../../i18n";
import { formatMoney, resolveAssetUrl } from "./tripFormatting";
import { PlaceAutocomplete } from "./PlaceAutocomplete";
import { z } from "zod";

const stepSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề là bắt buộc.").max(150, "Tiêu đề quá dài."),
  description: z.string().max(2000, "Mô tả quá dài.").optional(),
  type: z.enum(["Place", "Transport", "Hotel", "Restaurant", "Activity", "Note"]),
  scheduledAt: z.string().optional(),
  costAmount: z.string().optional(),
  googleMapsUrl: z.string().max(2048, "URL Google Maps quá dài.").optional(),
  externalUrl: z.string().max(2048, "URL bên ngoài quá dài.").optional(),
});

type StepFormValues = z.infer<typeof stepSchema>;

type TripStepFormProps = {
  step?: TripStep;
  submitLabel: string;
  isSaving: boolean;
  serverError: string | null;
  currencyCode: string;
  members: TripMember[];
  onSubmit: (payload: TripStepPayload) => Promise<void>;
};

export function TripStepForm({ step, submitLabel, isSaving, serverError, currencyCode, members, onSubmit }: TripStepFormProps) {
  const { locale, t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [participantMemberIds, setParticipantMemberIds] = useState<string[]>(step ? step.participantMemberIds : members.map((member) => member.id));
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors },
    watch,
  } = useForm<StepFormValues>({
    defaultValues: {
      title: step?.title ?? "",
      description: step?.description ?? "",
      type: step?.type ?? "Place",
      scheduledAt: step?.scheduledAt ? step.scheduledAt.slice(0, 16) : "",
      costAmount: step?.costAmount ?? "",
      googleMapsUrl: step?.googleMapsUrl ?? "",
      externalUrl: step?.externalUrl ?? "",
    },
  });

  const uploadedImageUrls = step?.imageUrls ?? [];
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  const costAmount = watch("costAmount");

  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  async function handleFormSubmit(values: StepFormValues) {
    setUploadError(null);
    const parsedValues = stepSchema.safeParse(values);

    if (!parsedValues.success) {
      for (const issue of parsedValues.error.issues) {
        const fieldName = issue.path[0] as keyof StepFormValues;
        setError(fieldName, { message: issue.message });
      }
      return;
    }

    const parsedCost = parsedValues.data.costAmount?.trim() ? Number(parsedValues.data.costAmount) : null;
    if (parsedValues.data.costAmount?.trim() && (parsedCost === null || !Number.isFinite(parsedCost) || parsedCost < 0)) {
      setError("costAmount", { message: "Chi phí phải bằng 0 hoặc lớn hơn." });
      return;
    }

    let imageUrls = uploadedImageUrls;
    if (files.length > 0) {
      setIsUploading(true);
      try {
        const uploaded: string[] = [];
        for (const file of files) {
          uploaded.push(await uploadFile(file, "TripStep"));
        }
        imageUrls = [...imageUrls, ...uploaded];
        setFiles([]);
      } catch {
        setUploadError(t("common.uploadImagesFailed"));
        return;
      } finally {
        setIsUploading(false);
      }
    }

    await onSubmit({
      title: parsedValues.data.title.trim(),
      description: parsedValues.data.description?.trim() || null,
      type: parsedValues.data.type as TripStepType,
      scheduledAt: parsedValues.data.scheduledAt ? new Date(parsedValues.data.scheduledAt).toISOString() : null,
      costAmount: parsedCost,
      googleMapsUrl: parsedValues.data.googleMapsUrl?.trim() || null,
      externalUrl: parsedValues.data.externalUrl?.trim() || null,
      imageUrls,
      participantMemberIds,
    });
  }

  const currentPreviewUrls = [
    ...uploadedImageUrls.map((url) => resolveAssetUrl(url)).filter((url): url is string => Boolean(url)),
    ...previewUrls,
  ];
  const costPreview = costAmount?.trim() ? formatMoney(costAmount, currencyCode, locale) : `${t("forms.enterAmountIn")} ${currencyCode}`;

  return (
    <form className="surface-card space-y-6 p-5 sm:p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      {serverError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p> : null}
      {uploadError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</p> : null}

      <PlaceAutocomplete
        disabled={isSaving || isUploading}
        onSelect={(suggestion) => {
          if (!getValues("title").trim()) {
            setValue("title", suggestion.name, { shouldDirty: true, shouldValidate: true });
          }
          setValue("googleMapsUrl", suggestion.googleMapsUrl, { shouldDirty: true, shouldValidate: true });
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("tripSteps.stepType")}
          <select className="form-input mt-1.5" {...register("type")}>
            {getStepTypeOptions(locale).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type ? <span className="mt-1.5 block text-sm text-red-600">{errors.type.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("tripSteps.title")}
          <input className="form-input mt-1.5" type="text" {...register("title")} />
          {errors.title ? <span className="mt-1.5 block text-sm text-red-600">{errors.title.message}</span> : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("tripSteps.scheduledDateTime")}
          <input className="form-input mt-1.5" type="datetime-local" {...register("scheduledAt")} />
          {errors.scheduledAt ? <span className="mt-1.5 block text-sm text-red-600">{errors.scheduledAt.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("tripSteps.cost")} ({currencyCode})
          <input className="form-input mt-1.5" inputMode="decimal" type="number" min="0" step="0.01" placeholder="0.00" {...register("costAmount")} />
          <span className="mt-1.5 block text-xs text-stone-500">{t("tripSteps.preview")}: {costPreview}</span>
          {errors.costAmount ? <span className="mt-1.5 block text-sm text-red-600">{errors.costAmount.message}</span> : null}
        </label>
      </div>


      {members.length > 0 ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">Members joining this step</p>
            <p className="mt-1 text-xs text-stone-500">The step cost will be split evenly across selected members.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {members.map((member) => (
              <label key={member.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm">
                <input
                  className="h-4 w-4 accent-teal-700"
                  type="checkbox"
                  checked={participantMemberIds.includes(member.id)}
                  onChange={(event) => {
                    setParticipantMemberIds((current) => event.target.checked ? [...current, member.id] : current.filter((id) => id !== member.id));
                  }}
                />
                {member.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <label className="block text-sm font-medium">
        {t("tripSteps.description")}
        <textarea className="form-input mt-1.5 min-h-28 resize-y" {...register("description")} />
        {errors.description ? <span className="mt-1.5 block text-sm text-red-600">{errors.description.message}</span> : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("tripSteps.googleMapsUrl")}
          <input className="form-input mt-1.5" type="url" {...register("googleMapsUrl")} />
          {errors.googleMapsUrl ? <span className="mt-1.5 block text-sm text-red-600">{errors.googleMapsUrl.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("tripSteps.externalUrl")}
          <input className="form-input mt-1.5" type="url" {...register("externalUrl")} />
          {errors.externalUrl ? <span className="mt-1.5 block text-sm text-red-600">{errors.externalUrl.message}</span> : null}
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {currentPreviewUrls.length > 0 ? (
            currentPreviewUrls.map((url, index) => (
              <img key={`${url}-${index}`} className="image-outline h-20 w-20 rounded-2xl object-cover" src={url} alt={t("tripSteps.currentImage")} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-500">{t("tripSteps.noImagesYet")}</div>
          )}
        </div>
        <input className="form-input text-sm" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
      </div>

      <button className="button-primary pressable active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving || isUploading}>
        {isUploading ? t("forms.uploading") : isSaving ? t("forms.saving") : submitLabel}
      </button>
    </form>
  );
}

