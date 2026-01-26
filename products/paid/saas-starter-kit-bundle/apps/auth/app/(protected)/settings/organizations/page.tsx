"use client"

import { OrganizationList } from "@/components/organizations/org-list"

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organizations</h3>
        <p className="text-sm text-muted-foreground">
          Manage your organizations and team members.
        </p>
      </div>
      <OrganizationList />
    </div>
  )
}
