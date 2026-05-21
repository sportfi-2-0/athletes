import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Sparkles, CalendarDays, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <nav className="border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-sm text-foreground">
                IRIS.ai
              </span>
            </div>

            <div className="flex items-center gap-1">
              <NavLink
                to="/"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                activeClassName="text-foreground bg-accent"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Roteiros
                </span>
              </NavLink>
              <NavLink
                to="/calendario"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                activeClassName="text-foreground bg-accent"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  Calendário
                </span>
              </NavLink>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
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