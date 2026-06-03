import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

import Login from "@/pages/login";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, roleRequired }: { component: ComponentType<any>, roleRequired?: "admin" | "user" }) {
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error || !user) {
    return <Redirect to="/login" />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/"} />;
  }

  return <Component user={user} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} roleRequired="admin" />}
      </Route>
      <Route path="/">
        {() => <ProtectedRoute component={UserDashboard} roleRequired="user" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
