"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import type { PolicySchema } from "@/features/auth/types";
import { errorMessage } from "@/lib/api/error-message";

import { useCreateGroup, useUpdateGroup, type GroupMutationValues } from "../api";
import { groupFormSchema, type GroupFormValues } from "../schemas";
import { ADMIN_ACTIONS, type ActionScope, type AdminAction, type Group } from "../types";

function buildDefaults(group: Group | null, schema: PolicySchema | undefined): GroupFormValues {
  const scopes = schema
    ? Object.keys(schema.actions)
        .filter((action): action is AdminAction =>
          (ADMIN_ACTIONS as readonly string[]).includes(action),
        )
        .map((action) => {
          const existing = group?.attributes.scopes[action];
          return {
            action,
            ownership: existing?.ownership ?? "own",
            markets: existing?.markets ?? [],
            currencies: existing?.currencies ?? [],
          };
        })
    : [];
  return {
    name: group?.name ?? "",
    permissions: group?.permissions ?? [],
    denyActions: group?.attributes.deny_actions ?? [],
    scopes,
    reason: "",
  };
}

interface GroupEditorProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupEditor({ group, open, onOpenChange }: GroupEditorProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tGlobal = useTranslations();
  const { capabilities } = useAuth();
  const schema = capabilities?.policy_schema;
  const isEdit = group != null;

  const create = useCreateGroup();
  const update = useUpdateGroup(group?.id ?? -1);
  const mutation = isEdit ? update : create;

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: buildDefaults(group, schema),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  // The parent only mounts this component while the dialog is open, so the
  // form is always initialized fresh from the group being edited.
  const scopeValues = useWatch({ control: form.control, name: "scopes" }) ?? [];

  const onSubmit = (values: GroupFormValues) => {
    setServerError(null);
    const scopes: Record<string, ActionScope> = { ...(group?.attributes.scopes ?? {}) };
    for (const entry of values.scopes) {
      const spec = schema?.actions[entry.action];
      const scope: ActionScope = { ownership: entry.ownership };
      if (spec?.markets) scope.markets = entry.markets;
      if (spec?.currencies) scope.currencies = entry.currencies;
      scopes[entry.action] = scope;
    }
    const payload: GroupMutationValues = {
      name: values.name,
      permissions: values.permissions,
      attributes: {
        schema_version: schema?.schema_version ?? 1,
        scopes,
        deny_actions: values.denyActions,
      },
      reason: values.reason,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? t("groupUpdated") : t("groupCreated"));
        onOpenChange(false);
      },
      onError: (error) => setServerError(errorMessage(tGlobal, error)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editGroup") : t("addGroup")}</DialogTitle>
          {isEdit && group && (
            <DialogDescription className="font-mono text-xs">{group.name}</DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid max-h-[65vh] gap-4 overflow-y-auto pe-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("groupName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("permissions")}</FormLabel>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                      {ADMIN_ACTIONS.map((action) => (
                        <Label
                          key={action}
                          className="flex items-center gap-2 text-sm font-normal"
                        >
                          <Checkbox
                            checked={field.value.includes(action)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, action]
                                  : field.value.filter((a) => a !== action),
                              )
                            }
                          />
                          <span className="truncate font-mono text-xs">{action}</span>
                        </Label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="denyActions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("denyActions")}</FormLabel>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                      {ADMIN_ACTIONS.map((action) => (
                        <Label
                          key={action}
                          className="flex items-center gap-2 text-sm font-normal"
                        >
                          <Checkbox
                            checked={field.value.includes(action)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, action]
                                  : field.value.filter((a) => a !== action),
                              )
                            }
                          />
                          <span className="truncate font-mono text-xs">{action}</span>
                        </Label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-2">
                <p className="text-sm font-medium">{t("scopeConstraints")}</p>
                <p className="text-xs text-muted-foreground">{t("attributesHint")}</p>
                {!schema ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  scopeValues.map((scope, index) => {
                    const spec = schema.actions[scope.action];
                    if (!spec) return null;
                    return (
                      <div key={scope.action} className="grid gap-3 rounded-lg border p-3">
                        <p className="font-mono text-xs font-medium">{scope.action}</p>
                        <FormField
                          control={form.control}
                          name={`scopes.${index}.ownership`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("ownership")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="own">{t("scopeOwn")}</SelectItem>
                                  <SelectItem value="owner_groups">
                                    {t("scopeOwnerGroups")}
                                  </SelectItem>
                                  <SelectItem value="all">{t("scopeAll")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {spec.markets && (
                          <FormField
                            control={form.control}
                            name={`scopes.${index}.markets`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("markets")}</FormLabel>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                  {(schema.markets ?? []).map((market) => (
                                    <Label
                                      key={market}
                                      className="flex items-center gap-2 text-sm font-normal"
                                    >
                                      <Checkbox
                                        checked={field.value.includes(market)}
                                        onCheckedChange={(checked) =>
                                          field.onChange(
                                            checked
                                              ? [...field.value, market]
                                              : field.value.filter((m) => m !== market),
                                          )
                                        }
                                      />
                                      <span className="font-mono text-xs">{market}</span>
                                    </Label>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {spec.currencies && (
                          <FormField
                            control={form.control}
                            name={`scopes.${index}.currencies`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("currencies")}</FormLabel>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                  {(schema.currencies ?? []).map((currency) => (
                                    <Label
                                      key={currency}
                                      className="flex items-center gap-2 text-sm font-normal"
                                    >
                                      <Checkbox
                                        checked={field.value.includes(currency)}
                                        onCheckedChange={(checked) =>
                                          field.onChange(
                                            checked
                                              ? [...field.value, currency]
                                              : field.value.filter((c) => c !== currency),
                                          )
                                        }
                                      />
                                      <span className="font-mono text-xs">{currency}</span>
                                    </Label>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

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
            </div>

            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? tc("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
