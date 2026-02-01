import Canvas from "@/components/Canvas";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">OpenPaint</h1>
          <p className="text-gray-600">A simple painting program</p>
        </header>
        <Canvas />
      </main>
    </div>
  );
}
