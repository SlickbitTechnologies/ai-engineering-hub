export function Footer() {
  return (
    <footer className="bg-gray-50 border-t py-2">
      <div className="container mx-auto flex flex-col items-center justify-center gap-3 px-4 text-center md:flex-row md:gap-6 md:text-left">
        <p className="text-sm text-gray-600 font-medium">
          © {new Date().getFullYear()} PharmaRedact. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-chateau-green-600 focus:text-chateau-green-600 hover:underline focus:underline transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-600 rounded-sm px-1">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-chateau-green-600 focus:text-chateau-green-600 hover:underline focus:underline transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-600 rounded-sm px-1">
            Terms of Service
          </a>
          <a href="#" className="hover:text-chateau-green-600 focus:text-chateau-green-600 hover:underline focus:underline transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-600 rounded-sm px-1">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
} 