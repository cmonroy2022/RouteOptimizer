import { AuthProvider } from "@/components/auth-provider"
import Component from "../route-optimizer"

export default function Page() {
  return (
    <AuthProvider>
      <Component />
    </AuthProvider>
  )
}
