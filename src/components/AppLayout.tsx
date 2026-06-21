import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Sparkles, CalendarDays, Bookmark } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { Logo } from "@/components/Logo";

interface AppLayoutProps {
  children: ReactNode;
}

const navItemClass =
  "px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent";
const navItemActiveClass = "text-foreground bg-accent";

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <nav className="border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 sm:gap-6">
            <Logo size={26} withWordmark />

            <div className="flex items-center gap-1">
              <NavLink to="/" end className={navItemClass} activeClassName={navItemActiveClass}>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Criar</span>
                </span>
              </NavLink>
              <NavLink
                to="/meus-roteiros"
                className={navItemClass}
                activeClassName={navItemActiveClass}
              >
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Meus Roteiros</span>
                </span>
              </NavLink>
              <NavLink
                to="/calendario"
                className={navItemClass}
                activeClassName={navItemActiveClass}
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </span>
              </NavLink>
            </div>
          </div>

          <UserMenu />
        </div>
      </nav>

      {/* Page Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>IRIS.ai • Marketing esportivo com IA • Sugestões como base inicial</p>
      </footer>
    </div>
  );
}
