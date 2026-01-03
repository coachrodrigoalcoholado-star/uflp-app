import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updateProfileCompletion } from "@/lib/userProgress";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                firstName: true,
                lastNamePaterno: true,
                lastNameMaterno: true,
                dob: true,
                sex: true,
                age: true,
                birthPlace: true,
                address: true,
                city: true,
                state: true,
                country: true,
                zipCode: true,
                phone: true,
                landline: true,
                email: true,
                alternativeEmail: true,
                profession: true,
                educationLevel: true,
                institution: true,
                currentOccupation: true,
                sedeNombre: true,
                entrenadorNombre: true,
                entrenadorCelular: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error obteniendo perfil:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const data = await req.json();

        // Validación básica (opcional, Prisma maneja tipos)
        // Convertir edad a int si viene como string
        if (data.age) {
            data.age = parseInt(data.age);
        }

        // Convertir fecha a objeto Date si es string
        if (data.dob) {
            data.dob = new Date(data.dob);
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                firstName: data.firstName,
                lastNamePaterno: data.lastNamePaterno,
                lastNameMaterno: data.lastNameMaterno,
                dob: data.dob,
                sex: data.sex,
                age: data.age,
                birthPlace: data.birthPlace,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                zipCode: data.zipCode,
                phone: data.phone,
                landline: data.landline,
                alternativeEmail: data.alternativeEmail,
                profession: data.profession,
                educationLevel: data.educationLevel,
                institution: data.institution,
                currentOccupation: data.currentOccupation,
                sedeNombre: data.sedeNombre,
                entrenadorNombre: data.entrenadorNombre,
                entrenadorCelular: data.entrenadorCelular,
            },
        });

        // Actualizar estado de completitud del perfil
        await updateProfileCompletion(updatedUser.id);

        // Obtener usuario actualizado con el flag correcto
        const finalUser = await prisma.user.findUnique({
            where: { id: updatedUser.id }
        });

        return NextResponse.json(finalUser);
    } catch (error) {
        console.error("Error actualizando perfil:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
