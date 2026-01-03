import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function requireSuperAdmin() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    if (session.user.role !== 'SUPERADMIN') {
        throw new Error('Unauthorized: Superadmin access required');
    }

    return session;
}

export async function requireAdminView() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    const { role } = session.user;
    if (role !== 'SUPERADMIN' && role !== 'AUDITOR') {
        redirect('/');
    }

    return session;
}

export async function isSuperAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'SUPERADMIN';
}

export async function isAdminView() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'AUDITOR';
}
