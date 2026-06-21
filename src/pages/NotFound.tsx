import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="glass-card rounded-3xl p-8 sm:p-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mb-6">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-extrabold text-5xl mb-3">
            <span className="gradient-text">404</span>
          </h1>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground mb-8">
            A página que você procura não existe ou foi movida.
          </p>
          <Button asChild variant="gradient" size="lg" className="w-full">
            <Link to="/">
              <Home className="w-5 h-5" />
              Voltar ao início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
