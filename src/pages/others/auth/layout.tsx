import { sessionMessages } from "@/lib/session-messages";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { PageMeta } from "@/components/shared/page-meta";
import ThemeToggleButton from "@/components/shared/header/theme-toggler";
export default function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-svh bg-[#f4f9fc] text-gray-700 lg:grid-cols-[45%_55%] dark:bg-[#081421] dark:text-gray-200">
      <PageMeta
        title={`${title} | BlueCare`}
        description="Acceso al panel administrativo de BlueCare"
      />
      <aside className="hidden flex-col justify-center bg-[#0d2875] px-16 py-12 text-white lg:flex dark:bg-[#0b1e4a]">
        <div className="mb-10 w-fit rounded-xl bg-white p-4 dark:bg-transparent">
          <BrandLogo className="w-56" />
        </div>
        <h1 className="text-5xl leading-tight font-medium">
          El cuidado
          <br />
          continúa.
        </h1>
        <p className="mt-8 text-xl text-blue-100">
          Membresías, prevención y bienestar.
          <br />
          Un equipo conectado en todas las clínicas.
        </p>
        <p className="mt-8 text-xs tracking-wider text-teal-300">
          PREVENCIÓN · BENEFICIOS · BIENESTAR
        </p>
      </aside>
      <main className="relative flex flex-col justify-center px-6 py-16 sm:px-16">
        <div className="absolute top-5 right-5">
          <ThemeToggleButton />
        </div>
        <div className="mx-auto w-full max-w-110">
          <BrandLogo className="mb-8 w-44 lg:hidden" />
          <h2 className="bc-title">{title}</h2>
          <p className="mt-5 mb-6 text-sm">{description}</p>
          {children}
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            {sessionMessages().authFooter}
          </p>
        </div>
      </main>
    </div>
  );
}
