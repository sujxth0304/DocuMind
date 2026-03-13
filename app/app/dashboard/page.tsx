"use client";

import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    { label: "Documents Indexed", value: "3", change: "+1 this week" },
    { label: "Questions Asked", value: "48", change: "+12 today" },
    { label: "Pages Processed", value: "64", change: "Across 3 docs" },
    { label: "Avg Response Time", value: "1.4s", change: "-0.3s improvement" },
  ];

  const recentActivity = [
    { id: 1, doc: "Q4 Engineering Strategy.pdf", question: "What are the key risks identified?", time: "2 hours ago" },
    { id: 2, doc: "Product Roadmap 2025.pdf", question: "Summarize the H2 priorities", time: "3 hours ago" },
    { id: 3, doc: "Architecture Decision Records.docx", question: "What decisions were made on database choice?", time: "1 day ago" },
    { id: 4, doc: "Q4 Engineering Strategy.pdf", question: "Who are the key stakeholders?", time: "2 days ago" },
  ];

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="border-b border-black/10 pb-6">
        <h1 className="text-2xl font-bold text-black tracking-tight">Dashboard</h1>
        <p className="text-black/40 text-sm mt-1">Your document intelligence overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-black/10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6">
            <p className="text-black/40 text-xs font-medium uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-bold text-black mt-3 tabular-nums">{stat.value}</p>
            <p className="text-black/40 text-xs mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black tracking-tight">Recent Questions</h2>
          <Link href="/app/questions">
            <Button variant="secondary" size="sm">Ask a Question</Button>
          </Link>
        </div>

        <div className="divide-y divide-black/10 border border-black/10">
          {recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between px-5 py-4 bg-white hover:bg-black/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black text-sm truncate">{item.question}</p>
                <p className="text-xs text-black/40 mt-0.5 truncate">
                  {item.doc} &middot; {item.time}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <span className="px-2.5 py-1 text-xs font-medium bg-black/5 text-black/50">
                  Answered
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-black tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-black">Upload a Document</h3>
            <p className="text-black/40 text-xs leading-relaxed">
              Add PDFs, Word docs, or text files to extract insights and ask questions.
            </p>
            <Link href="/app/documents">
              <Button variant="primary" className="w-full justify-center">Upload Document</Button>
            </Link>
          </Card>
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-black">Ask a Question</h3>
            <p className="text-black/40 text-xs leading-relaxed">
              Chat with your documents using natural language — get grounded, precise answers.
            </p>
            <Link href="/app/questions">
              <Button variant="primary" className="w-full justify-center">Start Chat</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
