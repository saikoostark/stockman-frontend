"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

import { useGroups } from "../api";
import type { Group } from "../types";
import { GroupEditor } from "./GroupEditor";

export function GroupsPage() {
  const t = useTranslations("admin");
  const tGlobal = useTranslations();
  const { can, capabilities } = useAuth();

  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);

  const allowed = can("access.manage");
  const groups = useGroups(page, allowed);

  if (!capabilities) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">{tGlobal("errors.permission_denied")}</p>
    );
  }

  const pagination = groups.data?.metadata.pagination;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.page_size))
    : 1;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("groups")}</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          {t("addGroup")}
        </Button>
      </div>

      {groups.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage(tGlobal, groups.error)}
        </p>
      ) : groups.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>{t("groupName")}</TableHead>
                <TableHead>{t("permissions")}</TableHead>
                <TableHead>{t("attributes")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(groups.data?.data ?? []).map((group) => {
                const shown = group.permissions.slice(0, 3);
                const rest = group.permissions.length - shown.length;
                const scopeCount = Object.keys(group.attributes.scopes ?? {}).length;
                const denyCount = (group.attributes.deny_actions ?? []).length;
                return (
                  <TableRow key={group.id}>
                    <TableCell className="font-mono text-xs">{group.id}</TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="max-w-72">
                      <div className="flex flex-wrap items-center gap-1">
                        {shown.map((permission) => (
                          <Badge key={permission} variant="outline" className="font-mono text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {rest > 0 && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            +{rest}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {t("scopeCount", { count: scopeCount })}
                        </Badge>
                        {denyCount > 0 && (
                          <Badge variant="destructive" className="font-mono text-xs">
                            {t("denyCount", { count: denyCount })}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(group);
                          setEditorOpen(true);
                        }}
                      >
                        {t("editGroup")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(groups.data?.data.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    {t("noGroups")}
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

      {editorOpen && (
        <GroupEditor group={editing} open={editorOpen} onOpenChange={setEditorOpen} />
      )}
    </div>
  );
}
