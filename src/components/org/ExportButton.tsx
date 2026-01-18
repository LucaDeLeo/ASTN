import { useQuery } from "convex/react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Spinner } from "~/components/ui/spinner";

interface ExportButtonProps {
  orgId: Id<"organizations">;
  orgSlug: string;
}

export function ExportButton({ orgId, orgSlug }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const members = useQuery(api.orgs.admin.getAllMembersWithProfiles, { orgId });

  const exportData = (format: "csv" | "json") => {
    if (!members || members.length === 0) return;

    setIsExporting(true);

    try {
      const date = new Date().toISOString().split("T")[0];
      const filename = `${orgSlug}-members-${date}.${format}`;

      if (format === "json") {
        exportJson(members, filename);
      } else {
        exportCsv(members, filename);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || !members}>
          {isExporting ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportData("csv")}>
          <FileSpreadsheet className="size-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData("json")}>
          <FileJson className="size-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Type for export data
type ExportMember = {
  membership: Doc<"orgMemberships">;
  profile: Doc<"profiles"> | null;
  email: string | null;
  completeness: number;
};

function exportJson(members: Array<ExportMember>, filename: string) {
  const data = members.map((m) => transformMemberForExport(m));

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}

function exportCsv(members: Array<ExportMember>, filename: string) {
  const headers = [
    "Name",
    "Email",
    "Location",
    "Headline",
    "Education",
    "Work History",
    "Skills",
    "Career Goals",
    "Profile Completeness",
    "Role",
    "Joined Date",
    "Directory Visibility",
  ];

  const rows = members.map((m) => {
    const data = transformMemberForExport(m);
    return [
      escapeCsvField(data.name),
      escapeCsvField(data.email),
      escapeCsvField(data.location),
      escapeCsvField(data.headline),
      escapeCsvField(data.education),
      escapeCsvField(data.workHistory),
      escapeCsvField(data.skills),
      escapeCsvField(data.careerGoals),
      `${data.profileCompleteness}%`,
      data.role,
      data.joinedDate,
      data.directoryVisibility,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

function transformMemberForExport(member: ExportMember) {
  const profile = member.profile;

  return {
    name: profile?.name || "",
    email: member.email || "",
    location: profile?.location || "",
    headline: profile?.headline || "",
    education: formatEducation(profile?.education),
    workHistory: formatWorkHistory(profile?.workHistory),
    skills: profile?.skills?.join(", ") || "",
    careerGoals: profile?.careerGoals || "",
    profileCompleteness: member.completeness,
    role: member.membership.role,
    joinedDate: new Date(member.membership.joinedAt).toISOString().split("T")[0],
    directoryVisibility: member.membership.directoryVisibility,
  };
}

function formatEducation(
  education: Doc<"profiles">["education"]
): string {
  if (!education || education.length === 0) return "";

  return education
    .map((e) => {
      const parts = [e.institution];
      if (e.degree) parts.push(e.degree);
      if (e.field) parts.push(`in ${e.field}`);
      return parts.join(" - ");
    })
    .join("; ");
}

function formatWorkHistory(
  workHistory: Doc<"profiles">["workHistory"]
): string {
  if (!workHistory || workHistory.length === 0) return "";

  return workHistory
    .map((w) => {
      return `${w.title} at ${w.organization}`;
    })
    .join("; ");
}

function escapeCsvField(value: string): string {
  if (!value) return '""';
  // Escape double quotes and wrap in quotes if contains comma, newline, or quotes
  const escaped = value.replace(/"/g, '""');
  if (
    escaped.includes(",") ||
    escaped.includes("\n") ||
    escaped.includes('"')
  ) {
    return `"${escaped}"`;
  }
  return escaped || '""';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
