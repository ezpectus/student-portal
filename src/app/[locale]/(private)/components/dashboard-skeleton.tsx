import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="flex flex-col gap-[20px]">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-[20px] lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-[20px]">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max grid-cols-12 gap-[20px] lg:auto-rows-auto">
        <Card className="col-span-full w-full 2xl:col-span-8">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="col-span-full lg:col-span-6 xl:col-span-4">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-4 h-20 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
