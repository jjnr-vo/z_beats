import { Library } from "@/components/library/library";
import { requireUser } from "@/lib/auth";
import { listSourceLibrary } from "@/lib/r2/r2";

export default async function DashboardPage() {
  await requireUser();
  const listing = await listSourceLibrary();

  return (
    <div className="rounded-[0.625rem] border border-[#98abc5] bg-[#f2f6fb] pt-5 shadow-[0_12px_30px_#11254a25,inset_0_1px_white]">
      <h1 className="px-4 text-[1.375rem] font-bold tracking-tight sm:px-6" id="library-title">
        Your library
      </h1>
      <Library listing={listing} />
    </div>
  );
}
