import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireAdminView();

        const users = await prisma.user.findMany({
            where: {
                role: 'STUDENT'
            },
            include: {
                cohort: true
            },
            orderBy: [
                { cohort: { code: 'asc' } },
                { lastNamePaterno: 'asc' }
            ]
        });

        // Format data to match "Profile Form" order
        const formattedData = users.map(user => ({
            "Camada": user.cohort?.code || 'Sin asignar',
            "Nombre(s)": user.firstName || '',
            "Apellido Paterno": user.lastNamePaterno || '',
            "Apellido Materno": user.lastNameMaterno || '',
            "Fecha de Nacimiento": user.dob ? new Date(user.dob).toLocaleDateString('es-ES') : '',
            "Edad": user.age || '',
            "Sexo": user.sex || '',
            "Lugar de Nacimiento": user.birthPlace || '',
            "Domicilio": user.address || '',
            "Municipio / Localidad": user.city || '',
            "Estado / Provincia": user.state || '',
            "País": user.country || '',
            "Código Postal": user.zipCode || '',
            "Teléfono Celular": user.phone || '',
            "Teléfono Fijo": user.landline || '',
            "Email Personal": user.email || '',
            "Email Alternativo": user.alternativeEmail || '',
            "Ocupación / Área": user.profession || '',
            "Escolaridad Máxima": user.educationLevel || '',
            "Instituto Título": user.institution || '',
            "Ocupación Actual": user.currentOccupation || '',
            "Sede": user.sedeNombre || '',
            "Nombre Entrenador": user.entrenadorNombre || '',
            "Celular Entrenador": user.entrenadorCelular || '',
            "Fecha de Registro": new Date(user.createdAt).toLocaleDateString('es-ES'),
            "Perfil Completo": user.profileCompleted ? 'SÍ' : 'NO',
            "Documentos Completos": user.documentsCompleted ? 'SÍ' : 'NO',
        }));

        return NextResponse.json({ data: formattedData });
    } catch (error) {
        console.error('Error fetching report data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
