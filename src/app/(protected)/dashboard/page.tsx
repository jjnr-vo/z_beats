import { Library } from "@/components/library/library";
import { requireUser } from "@/lib/auth";
import { listSourceLibrary } from "@/lib/r2/r2";

export default async function DashboardPage() {
  await requireUser();
  const listing = await listSourceLibrary();

  return (
    <>
      <div className="flex flex-col gap-7 border-b border-[#d8dfdc] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <h1
          className="mt-2 text-4xl font-semibold tracking-[-0.065em] text-[#172a38] sm:text-5xl"
          id="library-title"
        >
          Library
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#52656d]">
          A home for the music you keep. Find a track, press play, and stay right here.
        </p>
      </div>
      <Library listing={listing} />
    </>
  );
}
