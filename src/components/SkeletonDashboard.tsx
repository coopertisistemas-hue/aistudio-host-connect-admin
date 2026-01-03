import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonDashboard = () => (
    <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64 rounded-lg" />
                <Skeleton className="h-4 w-48 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-[250px] rounded-lg" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-soft border-none bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                        <Skeleton className="h-3 w-40 rounded-md" />
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Room Status Skeleton */}
        <Card className="shadow-soft border-none bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-6 w-48 rounded-md" />
                <Skeleton className="h-9 w-[200px] rounded-md" />
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-48 rounded-md" />
                </div>
            </CardContent>
        </Card>

        {/* Large Cards Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
            {[1, 2].map((i) => (
                <Card key={i} className="shadow-medium border-none bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40 rounded-md" />
                            <Skeleton className="h-4 w-64 rounded-md" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="flex items-center justify-between p-4 rounded-xl bg-white/30">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-32 rounded-md" />
                                    <Skeleton className="h-4 w-48 rounded-md" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-md" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);
