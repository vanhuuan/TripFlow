import { CheckCircle2, Map } from "lucide-react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function FocusModePage() {
  const { tripId } = useParams();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Focus mode"
        title={`Active trip ${tripId ?? ""}`.trim()}
        description="A focused step-by-step trip screen will replace this placeholder in the focus mode epic."
      />
      <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-coast">
          <Map size={22} aria-hidden="true" />
          <h2 className="text-base font-semibold">Current step</h2>
        </div>
        <p className="mt-3 text-sm text-stone-600">The first todo itinerary step will be highlighted here.</p>
        <button className="mt-5 inline-flex items-center gap-2 rounded bg-ink px-4 py-2 font-semibold text-white" type="button">
          <CheckCircle2 size={18} aria-hidden="true" />
          Mark done
        </button>
      </div>
    </section>
  );
}
