import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useLogout, useSearchBySerial, getGetMeQueryKey, getSearchBySerialQueryKey, type AuthUser, uploadPdf } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, UploadCloud, ShieldAlert, FileSearch, UserX, UserCheck, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard({ user }: { user: AuthUser }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logoutMutation = useLogout();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  
  const [file, setFile] = useState<File | null>(null);

  const { data: searchResult, isLoading: searchLoading, isError: searchError } = useSearchBySerial(
    { sn: activeSearch },
    { query: { enabled: !!activeSearch, retry: false, queryKey: getSearchBySerialQueryKey({ sn: activeSearch }) } }
  );

  const uploadMutation = useMutation({
    mutationFn: (fileToUpload: File) => {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      return uploadPdf({ body: formData });
    },
    onSuccess: () => {
      toast({ title: "Document Uploaded", description: "The PDF is now available for secure distribution." });
      setFile(null);
      const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.error || "Failed to process the document.",
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveSearch(searchTerm.trim());
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-slate-50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md border-b-4 border-blue-600">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-blue-400" />
          <h1 className="text-lg font-bold tracking-tight">System Administration</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="font-medium">{user.username}</span>
            <Badge variant="outline" className="border-blue-700 text-blue-300 bg-blue-900/30">
              Clearance: Administrator
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

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-slate-200/50 p-1">
            <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium">Trace Document</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium">Upload Master</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <FileSearch className="w-5 h-5 text-slate-500" />
                  Serial Number Tracing
                </CardTitle>
                <CardDescription>
                  Enter a watermark serial number to identify the originating user and their complete download history.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
                  <Input
                    placeholder="Enter serial number (e.g. SN-12345)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="font-mono text-base h-12 bg-white border-slate-300 focus-visible:ring-blue-500"
                    data-testid="input-search-serial"
                  />
                  <Button type="submit" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium" data-testid="button-search">
                    <Search className="w-4 h-4 mr-2" />
                    Trace
                  </Button>
                </form>
              </CardContent>
            </Card>

            {activeSearch && (
              <div className="space-y-6">
                {searchLoading && (
                  <Card className="border-slate-200 p-8 text-center bg-slate-50/50">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </Card>
                )}
                
                {searchError && !searchLoading && (
                  <Card className="border-red-200 bg-red-50 text-red-900 p-6 flex flex-col items-center justify-center text-center">
                    <UserX className="w-12 h-12 text-red-300 mb-3" />
                    <h3 className="font-semibold text-lg">No match found</h3>
                    <p className="text-red-700/80">No user or activity record exists for serial number "{activeSearch}".</p>
                  </Card>
                )}

                {searchResult && (
                  <div className="grid md:grid-cols-[1fr_2fr] gap-6">
                    <Card className="border-slate-200 shadow-sm h-fit">
                      <CardHeader className="bg-slate-900 text-white rounded-t-lg">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-blue-400" />
                          Subject Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">Username</p>
                          <p className="text-base font-semibold text-slate-900">{searchResult.user.username}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">Role</p>
                          <Badge variant="outline" className="uppercase tracking-wider text-xs font-bold bg-slate-100 text-slate-700 border-slate-300">
                            {searchResult.user.role}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">Assigned Serial</p>
                          <p className="font-mono text-lg font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded inline-block border border-slate-200">
                            {searchResult.user.serialNumber}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg text-slate-900">Activity Log</CardTitle>
                        <CardDescription>Comprehensive record of document access for this subject.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-semibold text-slate-700">Document</TableHead>
                              <TableHead className="font-semibold text-slate-700 text-right">Access Timestamp</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResult.downloads.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                                  No download records found for this subject.
                                </TableCell>
                              </TableRow>
                            ) : (
                              searchResult.downloads.map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell className="font-medium text-slate-900">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                      {record.filename}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm text-slate-500">
                                    {format(new Date(record.downloadedAt), 'MMM d, yyyy HH:mm:ss')}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-slate-200 shadow-sm max-w-2xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <UploadCloud className="w-5 h-5 text-slate-500" />
                  Add Master Document
                </CardTitle>
                <CardDescription>
                  Upload an unprotected PDF. The system will securely vault it and dynamically apply tracking watermarks upon user request.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleUploadSubmit} className="space-y-6">
                  <div className="grid w-full max-w-sm items-center gap-2">
                    <label htmlFor="pdf-upload" className="text-sm font-semibold text-slate-700">Document Source</label>
                    <Input 
                      id="pdf-upload" 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="cursor-pointer file:text-slate-900 file:font-semibold file:bg-slate-100 file:px-4 file:py-1 file:rounded-md file:border-0 hover:file:bg-slate-200 h-auto py-2"
                      data-testid="input-file-upload"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!file || uploadMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8"
                    data-testid="button-upload"
                  >
                    {uploadMutation.isPending ? "Vaulting Document..." : "Upload to Secure Vault"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
