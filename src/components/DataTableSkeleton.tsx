import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  variant?: "card" | "table";
}

const DataTableSkeleton = ({ rows = 5, columns = 4, variant = "card" }: DataTableSkeletonProps) => {
  if (variant === "table") {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {Array.from({ length: columns }).map((_, i) => (
                    <th key={i} className="p-2">
                      <Skeleton className="h-6 w-full" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                      <td key={colIndex} className="p-2">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-9" />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DataTableSkeleton;