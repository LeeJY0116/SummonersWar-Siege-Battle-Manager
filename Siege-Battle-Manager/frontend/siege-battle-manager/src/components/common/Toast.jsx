export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-2xl bg-black/90 px-4 py-2 text-sm font-semibold text-white shadow-lg">
      {message}
    </div>
  );
}