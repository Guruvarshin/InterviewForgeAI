"use client";

import Link from "next/link";
import MobileNav from "./mobile-nav";
import NavLink from "./nav-link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import ThemeToggle from "./theme-toggle";

const links = [
  { href: "/", label: "Home", public: true },
  { href: "/dashboard", label: "Dashboard", public: false },
  { href: "/session/new", label: "New Session", public: false },
];

export default function Navbar() {

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          InterviewForge <span className="text-xs opacity-60">AI</span>
        </Link>

        <nav className="hidden gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} prefetch={l.public ? true : false}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Button asChild variant="outline" size="sm">
             <Link href="/dashboard" prefetch={false}>Enter</Link>
            </Button>
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8" },
              }}
              userProfileMode="navigation"
              userProfileUrl="/user"
            />
          </SignedIn>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
