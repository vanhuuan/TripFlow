import { LoaderCircle, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { autocompletePlaces, type PlaceSuggestion } from "../../api/trips";
import { useI18n } from "../../i18n";

type PlaceAutocompleteProps = {
  onSelect: (suggestion: PlaceSuggestion) => void;
  disabled?: boolean;
};

export function PlaceAutocomplete({ onSelect, disabled = false }: PlaceAutocompleteProps) {
  const { localeCode, t } = useI18n();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await autocompletePlaces(normalizedQuery, localeCode, controller.signal);
        setSuggestions(results);
        setActiveIndex(results.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setActiveIndex(-1);
          setError(t("tripSteps.placeSearchError"));
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [localeCode, query, t]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectSuggestion(suggestion: PlaceSuggestion) {
    setQuery(suggestion.address ? `${suggestion.name}, ${suggestion.address}` : suggestion.name);
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
    onSelect(suggestion);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  const showPanel = isOpen && query.trim().length >= 2;
  const statusMessage = isLoading
    ? t("tripSteps.searchingPlaces")
    : error
      ? error
      : suggestions.length === 0 && query.trim().length >= 2
        ? t("tripSteps.noPlacesFound")
        : suggestions.length > 0
          ? `${suggestions.length} ${t("tripSteps.placesFound")}`
          : "";

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium" htmlFor={`${listboxId}-input`}>
        {t("tripSteps.findPlace")}
      </label>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} aria-hidden="true" />
        <input
          id={`${listboxId}-input`}
          className="form-input form-input-with-icons"
          type="search"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder={t("tripSteps.findPlacePlaceholder")}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {isLoading ? <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-coast" size={18} aria-hidden="true" /> : null}
      </div>
      <p className="mt-1.5 text-xs text-stone-500">{t("tripSteps.findPlaceHint")}</p>

      <div className="sr-only" aria-live="polite">{statusMessage}</div>
      {showPanel ? (
        <div id={listboxId} className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_rgba(28,25,23,0.12)]" role="listbox">
          {isLoading ? (
            <p className="px-3 py-3 text-sm text-stone-500">{t("tripSteps.searchingPlaces")}</p>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-red-700">{error}</p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-3 text-sm text-stone-500">{t("tripSteps.noPlacesFound")}</p>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                id={`${listboxId}-option-${index}`}
                className={`flex min-h-11 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color] duration-150 ${index === activeIndex ? "bg-teal-50" : "hover:bg-stone-50"}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-coast" aria-hidden="true">
                  <MapPin size={17} />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block font-semibold text-ink">{suggestion.name}</span>
                  {suggestion.address ? <span className="mt-0.5 block text-sm text-stone-500">{suggestion.address}</span> : null}
                </span>
              </button>
            ))
          )}
          <p className="px-3 pb-1 pt-2 text-right text-[11px] font-medium tracking-wide text-stone-400">Powered by Google</p>
        </div>
      ) : null}
    </div>
  );
}
