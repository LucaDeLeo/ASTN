import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  Monitor,
  Star,
  MessageSquare,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/profile/attendance")({
  component: AttendanceHistoryPage,
});

function AttendanceHistoryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <AuthLoading>
        <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <AttendanceContent />
      </Authenticated>
    </div>
  );
}

function UnauthenticatedRedirect() {
  const navigate = useNavigate();
  navigate({ to: "/login" });
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  );
}

function AttendanceContent() {
  const attendance = useQuery(api.attendance.queries.getMyAttendanceHistory, {
    limit: 50,
  });

  if (attendance === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/profile">
              <ArrowLeft className="size-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Attendance History
            </h1>
          </div>
        </div>

        {/* Content */}
        {attendance.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarCheck className="size-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">
              No events attended yet
            </h2>
            <p className="text-slate-500 mb-6">
              Your attendance history will appear here after you attend events
              from organizations you follow.
            </p>
            <Button asChild>
              <Link to="/orgs">Browse Organizations</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {attendance.map((record) => (
              <AttendanceCard key={record._id} record={record} />
            ))}
          </div>
        )}

        {/* Privacy indicator */}
        {attendance.length > 0 && (
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>
              Your attendance visibility is controlled in{" "}
              <Link
                to="/settings"
                className="text-primary hover:underline"
              >
                Settings
              </Link>
              . The hosting organization always sees attendance at their events.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

type AttendanceRecord = NonNullable<
  ReturnType<typeof useQuery<typeof api.attendance.queries.getMyAttendanceHistory>>
>[number];

function AttendanceCard({ record }: { record: AttendanceRecord }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Event title and org */}
          <h3 className="font-semibold text-foreground truncate">
            {record.event.title}
          </h3>
          {record.org && (
            <p className="text-sm text-slate-500 mt-0.5">{record.org.name}</p>
          )}

          {/* Event details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
            <span>{format(record.event.startAt, "EEE, MMM d, yyyy")}</span>
            <span className="flex items-center gap-1">
              {record.event.isVirtual ? (
                <>
                  <Monitor className="size-3.5" />
                  Online
                </>
              ) : (
                <>
                  <MapPin className="size-3.5" />
                  {record.event.location || "In person"}
                </>
              )}
            </span>
          </div>

          {/* Feedback if exists */}
          {record.feedbackRating && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-4 ${
                        star <= record.feedbackRating!
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                {record.feedbackText && (
                  <MessageSquare className="size-4 text-slate-400" />
                )}
              </div>
              {record.feedbackText && (
                <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">
                  {record.feedbackText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Status badge */}
        <StatusBadge status={record.status} />
      </div>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "attended" | "partial" | "not_attended" | "unknown";
}) {
  switch (status) {
    case "attended":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Attended
        </Badge>
      );
    case "partial":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          Partial
        </Badge>
      );
    case "not_attended":
      return (
        <Badge variant="secondary" className="text-slate-500">
          Did not attend
        </Badge>
      );
    case "unknown":
      return (
        <Badge variant="outline" className="text-slate-400">
          Unknown
        </Badge>
      );
  }
}
