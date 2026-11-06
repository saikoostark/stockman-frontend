"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/pagination-bar";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/error-message";

import { useAllGroups, useUpdateMembership, useUsers } from "../api";
import type { Group, User } from "../types";

const membershipSchema = z.object({
  group_ids: z.array(z.number()),
  is_active: z.boolean(),
  reason: z.string().min(1, "Reason is required"),
});
type MembershipFormValues = z.infer<typeof membershipSchema>;

function MembershipDialog({
  user,
  groups,
  open,
  onOpenChange,
}: {
  user: User;
  groups: Group[] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tGlobal = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  const update = useUpdateMembership(user.id);

  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      group_ids: user.group_ids,
      is_active: user.is_active,
      reason: "",
    },
  });

  const onSubmit = (values: MembershipFormValues) => {
    setServerError(null);
    update.mutate(values, {
      onSuccess: () => {
        toast.success(t("membershipUpdated"));
        onOpenChange(false);
      },
      onError: (error) => setServerError(errorMessage(tGlobal, error)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("setMemberships")} — {user.username}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="group_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("groups")}</FormLabel>
                  {groups == null ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="grid max-h-48 grid-cols-1 gap-y-1.5 overflow-y-auto pe-1">
                      {groups.map((group) => (
                        <Label
                          key={group.id}
                          className="flex items-center gap-2 text-sm font-normal"
                        >
                          <Checkbox
                            checked={field.value.includes(group.id)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, group.id]
                                  : field.value.filter((id) => id !== group.id),
                              )
                            }
                          />
                          <span className="truncate">{group.name}</span>
                        </Label>
                      ))}
                      {groups.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t("noGroups")}</p>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <FormLabel className="font-medium">{t("isActive")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reason")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? tc("saving") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const t = useTranslations("admin");
  const tGlobal = useTranslations();
  const { can, capabilities } = useAuth();

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);

  const allowed = can("access.manage");
  const users = useUsers(page, allowed);
  const groups = useAllGroups(allowed);

  if (!capabilities) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">{tGlobal("errors.permission_denied")}</p>
    );
  }

  const pagination = users.data?.metadata.pagination;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.page_size))
    : 1;

  return (
    <div className="grid gap-2">
      <h2 className="text-lg font-semibold">{t("users")}</h2>

      {users.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage(tGlobal, users.error)}
        </p>
      ) : users.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>{t("username")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("locale")}</TableHead>
                <TableHead>{t("isActive")}</TableHead>
                <TableHead>{t("authorizationRevision")}</TableHead>
                <TableHead>{t("groups")}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users.data?.data ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="max-w-48 truncate">{user.email}</TableCell>
                  <TableCell className="font-mono text-xs">{user.locale}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "secondary" : "outline"}>
                      {user.is_active ? t("isActive") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {user.authorization_revision}
                  </TableCell>
                  <TableCell className="max-w-52">
                    <div className="flex flex-wrap items-center gap-1">
                      {user.group_ids.length === 0 ? (
                        <span className="text-xs text-muted-foreground">{t("noGroups")}</span>
                      ) : (
                        user.group_ids.map((id) => (
                          <Badge key={id} variant="outline" className="font-mono text-xs">
                            {id}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="outline" size="sm" onClick={() => setSelected(user)}>
                      {t("setMemberships")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(users.data?.data.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                    {t("noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pagination && pagination.count > 0 && (
            <PaginationBar
              label={t("pageXofY", { page: pagination.page, pages: totalPages })}
              prevLabel={t("previous")}
              nextLabel={t("next")}
              canPrev={page > 1}
              canNext={page < totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </>
      )}

      {selected && (
        <MembershipDialog
          key={selected.id}
          user={selected}
          groups={groups.data}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </div>
  );
}
