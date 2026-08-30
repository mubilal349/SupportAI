import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
          <SearchX className="h-8 w-8 text-slate-400" />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
          Error 404
        </p>

        <h1 className="mb-4 text-4xl font-bold">Page Not Found</h1>

        <p className="mb-8 text-slate-400">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
