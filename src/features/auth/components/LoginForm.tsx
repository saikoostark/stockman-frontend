"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api/error-message";
import { Link, useRouter } from "@/i18n/navigation";

import { useLogin } from "../api";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => {
    setServerError(null);
    login.mutate(values, {
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
      onError: (error) => setServerError(errorMessage(t, error)),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("username")}</FormLabel>
              <FormControl>
                <Input autoComplete="username" {...field} />
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
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? tc("loading") : t("loginSubmit")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium underline underline-offset-4">
            {t("registerSubmit")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
