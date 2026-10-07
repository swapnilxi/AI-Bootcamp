import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div className="flex-grow flex items-center justify-center py-24 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
          <Icon name="star" size={32} />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
            404 &bull; AI Coordinates Not Found
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-text font-light">
            Lost Among the Constellations
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            That page does not exist. Head back to the paths, or pick up where you left off.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
          <Link href="/book" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              Book a Session
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
