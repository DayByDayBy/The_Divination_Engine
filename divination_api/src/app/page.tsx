export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Divination Engine API
        </h1>
        <p className="text-gray-600 mb-6">
          TypeScript backend for the Divination Engine application.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• API endpoints: /api/*</p>
          <p>• Built with Next.js & TypeScript</p>
          <p>• Deployed on Cloudflare Pages</p>
        </div>
      </div>
    </div>
  );
}
