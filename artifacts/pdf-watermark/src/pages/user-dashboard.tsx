import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout, useListPdfs, getGetMeQueryKey, type AuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, FileText, Download, ShieldCheck, Fingerprint } from "lucide-react";
import { format } from "date-fns";

export default function UserDashboard({ user }: { user: AuthUser }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const { data: pdfs, isLoading: pdfsLoading } = useListPdfs();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-slate-50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-slate-300" />
          <h1 className="text-lg font-bold tracking-tight">Secure Document Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="font-medium">{user.username}</span>
            <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-800">
              Clearance: Standard
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            disabled={logoutMutation.isPending}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        <section>
          <Card className="border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-slate-100 to-transparent pointer-events-none" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Fingerprint className="w-5 h-5 text-slate-500" />
                Active Tracing Identity
              </CardTitle>
              <CardDescription>
                All downloaded documents will be indelibly watermarked with this unique identifier.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {user.serialNumber ? (
                <div className="bg-slate-900 rounded-lg p-6 flex flex-col items-start gap-1 shadow-inner inline-flex">
                  <span className="text-slate-400 text-xs font-mono uppercase tracking-widest">Serial Assignment</span>
                  <span className="text-3xl font-mono font-bold text-white tracking-wider" data-testid="text-serial-number">{user.serialNumber}</span>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-lg p-6 border border-slate-200 border-dashed inline-flex flex-col gap-2">
                  <span className="text-slate-500 font-medium">Pending Assignment</span>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Your unique tracking serial number will be generated and assigned permanently upon your first document download.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Available Documents</h2>
            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
              {pdfs?.length || 0} Files
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pdfsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-slate-200">
                  <CardHeader className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))
            ) : pdfs?.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No documents available</h3>
                <p className="text-slate-500">There are currently no protected documents available for download.</p>
              </div>
            ) : (
              pdfs?.map((pdf) => (
                <Card key={pdf.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <CardHeader className="p-5 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1 pr-4">
                      <CardTitle className="text-base font-semibold leading-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                        {pdf.filename}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-mono">
                        ID: {pdf.id.toString().padStart(6, '0')} • Added {format(new Date(pdf.uploadedAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-md shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                  </CardHeader>
                  <CardFooter className="p-5 pt-0">
                    <Button 
                      asChild 
                      variant="default" 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
                      data-testid={`link-download-${pdf.id}`}
                    >
                      <a href={`/api/pdfs/${pdf.id}/download`} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download Secure Copy
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
