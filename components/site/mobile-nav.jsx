"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import ThemeToggle from "./theme-toggle";
import { Menu } from "lucide-react";

/**
 * Mobile sheet menu for small screens.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  const LinkItem = ({ href, children }) => (
    <Link
      href={href}
      prefetch={false}
      className="block rounded-md px-2 py-2 text-base hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">InterviewForge</SheetTitle>
        </SheetHeader>

        <div className="mt-4 grid gap-1">
          <LinkItem href="/">Home</LinkItem>
          <LinkItem href="/dashboard">Dashboard</LinkItem>
          <LinkItem href="/session/new">New Session</LinkItem>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm" onClick={() => setOpen(false)}>Sign in</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            </SignedIn>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
