import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      <AdminSidebar />

      <div className="min-h-screen lg:pl-64">
        <AdminHeader />

        <main className="min-h-[calc(100vh-72px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
