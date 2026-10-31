import * as React from "react"
import AppLayout from "./AppLayout"

export default function CustomerLayout({ children }) {
  return <AppLayout role="customer">{children}</AppLayout>
}

