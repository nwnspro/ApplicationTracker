export function Loading() {
  return (
    <div className="min-h-screen bg-[#f9f3e8] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-800 mx-auto"></div>
        <p className="mt-4 text-gray-800 font-medium">Loading...</p>
      </div>
    </div>
  );
}
