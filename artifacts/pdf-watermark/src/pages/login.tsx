import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (user) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation(user.role === "admin" ? "/admin" : "/");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: (err as any)?.data?.error || "Invalid username or password.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 opacity-50" />
      
      <Card className="w-full max-w-md z-10 border-slate-200 shadow-xl shadow-slate-200/50">
        <CardHeader className="space-y-4 pb-8">
          <div className="mx-auto bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Secure Portal Access</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Institutional Document Protection System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Identifier</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your assigned username" 
                          {...field} 
                          className="bg-slate-50/50 border-slate-200 focus-visible:ring-slate-900"
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Passphrase</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="bg-slate-50/50 border-slate-200 focus-visible:ring-slate-900"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold tracking-wide h-11"
                disabled={loginMutation.isPending}
                data-testid="button-submit-login"
              >
                {loginMutation.isPending ? "Authenticating..." : "Authenticate"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
