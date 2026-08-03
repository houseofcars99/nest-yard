import "./admin-enhancements.css";
import { AdminClient } from "@/components/AdminClient";
import { AdminEnhancements } from "@/components/AdminEnhancements";
import { AdminBrandLogo } from "@/components/AdminBrandLogo";

export default function AdminPage() {
  return (
    <>
      <AdminClient />
      <AdminEnhancements />
      <AdminBrandLogo />
    </>
  );
}
