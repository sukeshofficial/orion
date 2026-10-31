import * as React from "react"
import AppLayout from "./AppLayout"

export default function AdminLayout({ children }) {
  return <AppLayout role="admin">{children}</AppLayout>
}

