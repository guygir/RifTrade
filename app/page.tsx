import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">RifTrade - Riftbound Card Swap</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          A lightweight, non-commercial community card swap directory for the Riftbound TCG.
        </p>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Disclaimer:</strong> This is an unofficial app. It does not facilitate or guarantee trades. 
            All trades happen externally between users. This platform acts as a bulletin board/matchmaking tool only.
          </p>
        </div>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/cards" 
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Browse Cards</h2>
            <p className="text-gray-600 dark:text-gray-400">View all available Riftbound cards</p>
          </Link>
          <Link 
            href="/search" 
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Search & Match</h2>
            <p className="text-gray-600 dark:text-gray-400">Find users who have cards you want</p>
          </Link>
          <Link 
            href="/profile" 
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">My Profile</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your have/want lists</p>
          </Link>
          <Link 
            href="/login" 
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Login / Sign Up</h2>
            <p className="text-gray-600 dark:text-gray-400">Create an account to get started</p>
          </Link>
        </nav>

        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Card data sourced from <a href="https://riftcodex.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-400">Riftcodex</a></p>
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-bold mb-4">Changelog</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">January 2025</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                <li><strong>Enhanced security</strong> with input sanitization and URL validation</li>
                <li><strong>Implemented dark mode support</strong> with theme toggle</li>
                <li>Added text file download for card lists</li>
                <li>Added PDF export functionality for card lists with progress tracking</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-bold mb-4">Contributors Welcome!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We welcome contributions! Here are some areas where help is needed:
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Current Priority Tasks</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300 ml-2">
              <li><strong>Support Multiple Tabs:</strong> Fix Supabase auth conflicts when users have multiple tabs open. Currently, multiple tabs can cause AbortErrors and prevent data from loading.</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Want to contribute? Check out our <a href="https://github.com/guygir/RifTrade" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-400 font-medium">GitHub repository</a> to get started!
          </p>
        </div>
      </div>
    </main>
  );
}

