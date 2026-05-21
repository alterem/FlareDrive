import { MOCK_AUTH } from "@/app/mockApi";

export function HeaderBrand() {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-brand">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white">
        FD
      </div>
      <span className="hidden sm:inline">Flare Drive</span>
      {MOCK_AUTH && (
        <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30">
          Demo
        </span>
      )}
    </div>
  );
}
