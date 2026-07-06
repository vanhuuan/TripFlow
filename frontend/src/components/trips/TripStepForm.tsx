import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadFile, type TripStep, type TripStepPayload, type TripStepType } from "../../api/trips";
import { resolveAssetUrl } from "./tripFormatting";

const stepSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150, "Title is too long."),
  description: z.string().max(2000, "Description is too long.").optional(),
  type: z.enum(["Place", "Transport", "Hotel", "Restaurant", "Activity", "Note"]),
  scheduledAt: z.string().optional(),
  googleMapsUrl: z.string().max(2048, "Google Maps URL is too long.").optional(),
  externalUrl: z.string().max(2048, "External URL is too long.").optional(),
});

type StepFormValues = z.infer<typeof stepSchema>;

type TripStepFormProps = {
  step?: TripStep;
  submitLabel: string;
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: TripStepPayload) => Promise<void>;
};

export function TripStepForm({ step, submitLabel, isSaving, serverError, onSubmit }: TripStepFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, setError, setValue, watch, formState: { errors } } = useForm<StepFormValues>({ defaultValues: { title: step?.title ?? "", description: step?.description ?? "", type: step?.type ?? "Place", scheduledAt: step?.scheduledAt ? step.scheduledAt.slice(0, 16) : "", googleMapsUrl: step?.googleMapsUrl ?? "", externalUrl: step?.externalUrl ?? "" } });
  const uploadedImageUrls = step?.imageUrls ?? [];
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  async function handleFormSubmit(values: StepFormValues) {
    setUploadError(null);
    const parsedValues = stepSchema.safeParse(values);
    if (!parsedValues.success) { for (const issue of parsedValues.error.issues) { const fieldName = issue.path[0] as keyof StepFormValues; setError(fieldName, { message: issue.message }); } return; }
    let imageUrls = uploadedImageUrls;
    if (files.length > 0) {
      setIsUploading(true);
      try { const uploaded = []; for (const file of files) uploaded.push(await uploadFile(file)); imageUrls = [...imageUrls, ...uploaded]; setFiles([]); } catch { setUploadError("Image upload failed."); return; } finally { setIsUploading(false); }
    }
    await onSubmit({ title: parsedValues.data.title.trim(), description: parsedValues.data.description?.trim() || null, type: parsedValues.data.type as TripStepType, scheduledAt: parsedValues.data.scheduledAt ? new Date(parsedValues.data.scheduledAt).toISOString() : null, googleMapsUrl: parsedValues.data.googleMapsUrl?.trim() || null, externalUrl: parsedValues.data.externalUrl?.trim() || null, imageUrls });
  }

  const currentPreviewUrls = [...uploadedImageUrls.map((url) => resolveAssetUrl(url)).filter((url): url is string => Boolean(url)), ...previewUrls];

  return <form className="space-y-5 rounded border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(handleFormSubmit)}>{serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}{uploadError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Step type<select className="mt-1 w-full rounded border border-stone-300 px-3 py-2" {...register("type")}>{["Place", "Transport", "Hotel", "Restaurant", "Activity", "Note"].map((value) => <option key={value} value={value}>{value}</option>)}</select>{errors.type ? <span className="mt-1 block text-sm text-red-600">{errors.type.message}</span> : null}</label><label className="block text-sm font-medium">Title<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="text" {...register("title")} />{errors.title ? <span className="mt-1 block text-sm text-red-600">{errors.title.message}</span> : null}</label></div><label className="block text-sm font-medium">Description<textarea className="mt-1 min-h-28 w-full rounded border border-stone-300 px-3 py-2" {...register("description")} />{errors.description ? <span className="mt-1 block text-sm text-red-600">{errors.description.message}</span> : null}</label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Scheduled date/time<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="datetime-local" {...register("scheduledAt")} />{errors.scheduledAt ? <span className="mt-1 block text-sm text-red-600">{errors.scheduledAt.message}</span> : null}</label><label className="block text-sm font-medium">Google Maps URL<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="url" {...register("googleMapsUrl")} />{errors.googleMapsUrl ? <span className="mt-1 block text-sm text-red-600">{errors.googleMapsUrl.message}</span> : null}</label></div><label className="block text-sm font-medium">External URL<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="url" {...register("externalUrl")} />{errors.externalUrl ? <span className="mt-1 block text-sm text-red-600">{errors.externalUrl.message}</span> : null}</label><div className="space-y-3"><div className="flex flex-wrap gap-2">{currentPreviewUrls.length > 0 ? currentPreviewUrls.map((url, index) => <img key={`${url}-${index}`} className="h-20 w-20 rounded object-cover ring-1 ring-stone-200" src={url} alt="Attachment preview" />) : <div className="text-sm text-stone-500">No images yet.</div>}</div><input className="w-full rounded border border-stone-300 px-3 py-2 text-sm" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></div><button className="rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={isSaving || isUploading}>{isSaving ? "Saving..." : submitLabel}</button></form>;
}

