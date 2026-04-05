import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { onBoardUser } from "@/modules/auth/action";

export default async function  Home() {

  await onBoardUser();

  const featuredProblems = [
    {
      title: "Two Sum",
      difficulty: "Easy",
      tags: ["Array", "Hash Map"],
      href: "/problems",
    },
    {
      title: "Merge Intervals",
      difficulty: "Medium",
      tags: ["Sorting", "Greedy"],
      href: "/problems",
    },
    {
      title: "Longest Increasing Subsequence",
      difficulty: "Hard",
      tags: ["DP", "Binary Search"],
      href: "/problems",
    },
  ];

  return (
    <section className="relative mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-4 overflow-hidden px-4 py-4 md:gap-6 md:py-6">
      <div className="rounded-3xl border border-neutral-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-7">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline">AlgoLab</Badge>
          <Badge variant="secondary">LeetCode-style practice</Badge>
        </div>

        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-neutral-900 md:text-5xl">
          Practice coding interviews with structured problems and clean feedback.
        </h1>

        <p className="mt-4 max-w-2xl text-sm text-neutral-600 md:text-base">
          Pick a problem, write your solution, and level up through curated patterns across arrays,
          graphs, dynamic programming, and more.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/problems">Start Solving</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">How It Works</Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">Problem Bank</p>
            <p className="text-2xl font-semibold text-neutral-900">450+</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">Daily Active Solvers</p>
            <p className="text-2xl font-semibold text-neutral-900">12k</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">Languages</p>
            <p className="text-2xl font-semibold text-neutral-900">Python, JS, C++</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Featured Problems</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/problems">View all</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {featuredProblems.map((problem) => (
            <Card key={problem.title} className="border-neutral-200 bg-white/90">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{problem.title}</CardTitle>
                  <Badge variant="outline">{problem.difficulty}</Badge>
                </div>
                <CardDescription>Master the pattern and optimize your runtime.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {problem.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={problem.href}>Solve Problem</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
