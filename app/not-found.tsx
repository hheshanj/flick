import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass rounded-3xl p-10 max-w-md w-full text-center relative z-10 border border-red-500/10">
        <div className="w-20 h-20 bg-gradient-to-tr from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] text-red-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-white">404 - File Not Found</h1>
        <p className="text-gray-400 text-lg font-medium mb-8">
          This link is invalid, or the file has gracefully vanished into the void.
        </p>
        <Link
          href="/"
          className="inline-block bg-white/5 hover:bg-white/10 transition border border-transparent hover:border-white/10 py-3 px-8 rounded-xl text-gray-300 font-medium"
        >
          Share a New File
        </Link>
      </div>
    </main>
  );
}
