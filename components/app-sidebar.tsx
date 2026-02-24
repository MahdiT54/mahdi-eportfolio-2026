import { Suspense } from "react";
import { Sidebar, SidebarContent, SidebarRail } from "./ui/sidebar";
import ChatWrapper from "./chat/ChatWrapper";
import { cn } from "@/lib/utils";

export function AppSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className={cn("z-[70]", className)} {...props}>
      <SidebarContent>
        <Suspense fallback={<div>Loading...</div>}>
          <ChatWrapper />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
