import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { profileCompleted: true }
    });

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Mi Perfil</h1>
                <Link href="/" style={{ textDecoration: "underline", color: "#0070f3" }}>Volver al Inicio</Link>
            </div>

            <ProfileForm isCompleted={user?.profileCompleted || false} />
        </div>
    );
}
