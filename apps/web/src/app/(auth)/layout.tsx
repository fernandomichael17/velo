export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            {/* Left: Form */}
            <div className="flex-1 flex items-center justify-center px-6">
                {children}
            </div>

            {/* Right: Branding Panel */}
            <div className="hidden lg:flex flex-1 bg-ink text-white items-center justify-center p-12">
                <div className="max-w-md">
                    <svg width="44" height="44" viewBox="0 0 44 44" className="mb-8">
                        <polygon points="6,8 18,32 30,8" fill="#3B82F6" />
                        <polygon points="18,8 30,32 42,8" fill="#3B82F6" opacity="0.35" />
                    </svg>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                        Move fast, together.
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Platform project management untuk tim yang bergerak cepat.
                        Dari ide pertama hingga fitur yang dirilis.
                    </p>
                </div>
            </div>
        </div>
    );
}