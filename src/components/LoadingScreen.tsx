
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingScreen() {
  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-8 w-48 bg-crm-card" />
        <Skeleton className="h-10 w-32 bg-crm-card" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-crm-card border-crm-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg bg-gray-700" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                  <Skeleton className="h-6 w-20 bg-gray-700" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 bg-gray-700" />
                <Skeleton className="h-8 w-8 bg-gray-700" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full bg-gray-700" />
              <Skeleton className="h-3 w-3/4 bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
