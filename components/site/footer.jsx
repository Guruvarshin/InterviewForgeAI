export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <p>© {new Date().getFullYear()} InterviewForge AI</p>
          <p className="opacity-75">Built with Love by Guru</p>
        </div>
      </div>
    </footer>
  );
}
