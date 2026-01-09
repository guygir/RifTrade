import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Riftbound Card Swap</h1>
        <p className="text-lg text-gray-600 mb-8">
          A lightweight, non-commercial community card swap directory for the Riftbound TCG.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This is an unofficial app. It does not facilitate or guarantee trades. 
            All trades happen externally between users. This platform acts as a bulletin board/matchmaking tool only.
          </p>
        </div>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/cards" 
            className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Browse Cards</h2>
            <p className="text-gray-600">View all available Riftbound cards</p>
          </Link>
          <Link 
            href="/search" 
            className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Search & Match</h2>
            <p className="text-gray-600">Find users who have cards you want</p>
          </Link>
          <Link 
            href="/profile" 
            className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">My Profile</h2>
            <p className="text-gray-600">Manage your have/want lists</p>
          </Link>
          <Link 
            href="/login" 
            className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Login / Sign Up</h2>
            <p className="text-gray-600">Create an account to get started</p>
          </Link>
        </nav>

        <div className="mt-12 text-sm text-gray-500">
          <p>Card data sourced from <a href="https://riftcodex.com" target="_blank" rel="noopener noreferrer" className="underline">Riftcodex</a></p>
        </div>
      </div>
    </main>
  );
}

