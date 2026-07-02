import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadFile, type TripDetail, type TripPayload } from "../../api/trips";
import { resolveAssetUrl } from "./tripFormatting";

const tripSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(150, "Title is too long."),
    destination: z.string().trim().min(1, "Destination is required.").max(150, "Destination is too long."),
    description: z.string().max(2000, "Description is too long.").optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    coverImageUrl: z.string().max(2048, "Cover image URL is too long.").optional(),
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
    },
  });

  const coverImageUrl = watch("coverImageUrl") || null;
  const previewUrl = coverFile ? URL.createObjectURL(coverFile) : resolveAssetUrl(coverImageUrl);

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
        finalCoverImageUrl = await uploadFile(coverFile);
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
    });
  }

  return (
    <form className="space-y-5 rounded border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(handleFormSubmit)}>
      {serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
      {uploadError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Title
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="text" placeholder="Summer in Kyoto" {...register("title")} />
          {errors.title ? <span className="mt-1 block text-sm text-red-600">{errors.title.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Start date
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="date" {...register("startDate")} />
          {errors.startDate ? <span className="mt-1 block text-sm text-red-600">{errors.startDate.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          End date
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="date" {...register("endDate")} />
          {errors.endDate ? <span className="mt-1 block text-sm text-red-600">{errors.endDate.message}</span> : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-start">
        <div className="h-32 overflow-hidden rounded border border-stone-200 bg-stone-100">
          {previewUrl ? <img className="h-full w-full object-cover" src={previewUrl} alt="Trip cover preview" /> : <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-500">No cover image</div>}
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Cover image
            <input
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <input type="hidden" {...register("coverImageUrl")} />
        </div>
      </div>

      <button className="rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={isSaving || isUploading}>
        {isUploading ? "Uploading..." : isSaving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
