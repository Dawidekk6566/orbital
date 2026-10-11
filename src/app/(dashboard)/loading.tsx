/* Shared loading skeleton for dashboard segments — hairline blocks
   that pulse. Matches the card radii and line tokens. */

export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 rounded-[6px] bg-line" />
      <div className="mt-3 h-4 w-80 rounded-[6px] bg-line/60" />
      <div className="mt-8 grid grid-cols-3 gap-4 max-[820px]:grid-cols-1">
        <div className="h-28 rounded-[10px] border border-line bg-white" />
        <div className="h-28 rounded-[10px] border border-line bg-white" />
        <div className="h-28 rounded-[10px] border border-line bg-white" />
      </div>
      <div className="mt-8 h-40 rounded-[10px] border border-line bg-white" />
    </div>
  );
}
