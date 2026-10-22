import { Library } from "@/components/library/library";

export default function DashboardPage() {
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
          A home for the music you keep. Find a track, press play, and stay
          right here.
        </p>
      </div>
      <Library />
    </>
  );
}
