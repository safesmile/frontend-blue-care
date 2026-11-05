import { Link } from "react-router";
export function PageBreadcrumb({ pageTitle }: { pageTitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="bc-title">{pageTitle}</h1>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <Link to="/">Blue Care</Link> / {pageTitle} · Datos ilustrativos
      </p>
    </div>
  );
}
