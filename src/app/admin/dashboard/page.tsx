import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import DashboardTable from "@/components/admin/DashboardTable";
import AppHeader from "@/components/AppHeader"; // Assuming this is used or we use the layout's header

// We rely on the parent layout for Sidebar/Header structure if present. 
// Based on layout.tsx check, we might adjusting wrapping.

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AUDITOR' && session.user.role !== 'ADMIN')) {
        redirect("/auth/login");
    }

    // Fetch data directly for Server Component efficiency
    const students = await prisma.user.findMany({
        where: {
            role: "STUDENT",
        },
        include: {
            documents: true,
            payments: true,
            cohort: true,
        },
        orderBy: {
            lastNamePaterno: "asc",
        },
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Estado de Documentación y Pagos</h1>
                    <p className="text-gray-500">Vista general del progreso de los alumnos</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <DashboardTable initialData={students} />
            </div>
        </div>
    );
}
