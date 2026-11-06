"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
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

import { useRegister } from "../api";
import { registerSchema, type RegisterValues } from "../schemas";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const register = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (values: RegisterValues) => {
    setServerError(null);
    register.mutate(
      {
        username: values.username,
        email: values.email || "",
        password: values.password,
        locale: locale as string,
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
        onError: (error) => setServerError(errorMessage(t, error)),
      },
    );
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("confirmPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? tc("loading") : t("registerSubmit")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium underline underline-offset-4">
            {t("loginSubmit")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
