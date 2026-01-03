import prisma from "./prisma";
import { DOCUMENT_TYPES } from "./constants";

/**
 * Verifica si el perfil del usuario está completo
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            firstName: true,
            lastNamePaterno: true,
            lastNameMaterno: true,
            dob: true,
            sex: true,
            birthPlace: true,
            address: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            phone: true,
            profession: true,
            educationLevel: true,
            institution: true,
        },
    });

    if (!user) return false;

    // Verificar que todos los campos requeridos estén completos
    const requiredFields = [
        user.firstName,
        user.lastNamePaterno,
        user.lastNameMaterno,
        user.dob,
        user.sex,
        user.birthPlace,
        user.address,
        user.city,
        user.state,
        user.country,
        user.zipCode,
        user.phone,
        user.profession,
        user.educationLevel,
        user.institution,
    ];

    return requiredFields.every(field => field !== null && field !== undefined && field !== "");
}

/**
 * Verifica si el usuario ha subido todos los documentos requeridos
 */
export async function areDocumentsComplete(userId: string): Promise<boolean> {
    const documents = await prisma.document.findMany({
        where: { userId },
        select: { type: true },
    });

    const uploadedTypes = documents.map(doc => doc.type);

    // Verificar que todos los tipos de documentos requeridos estén subidos
    return DOCUMENT_TYPES.every(requiredType => uploadedTypes.includes(requiredType));
}

/**
 * Actualiza el estado de completitud del perfil del usuario
 */
export async function updateProfileCompletion(userId: string): Promise<void> {
    const isComplete = await isProfileComplete(userId);

    await prisma.user.update({
        where: { id: userId },
        data: { profileCompleted: isComplete },
    });
}

/**
 * Actualiza el estado de completitud de documentos del usuario
 */
export async function updateDocumentsCompletion(userId: string): Promise<void> {
    // Check previous status
    const prevUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { documentsCompleted: true }
    });

    const isComplete = await areDocumentsComplete(userId);

    await prisma.user.update({
        where: { id: userId },
        data: { documentsCompleted: isComplete },
    });

    // If it was NOT complete before, and IS complete now -> Notify
    if (prevUser && !prevUser.documentsCompleted && isComplete) {
        await notifyAdminsOfCompletion(userId);
    }
}

/**
 * Obtiene el estado de progreso del usuario
 */
export async function getUserProgress(userId: string): Promise<{
    profileCompleted: boolean;
    documentsCompleted: boolean;
    canAccessDocuments: boolean;
    canAccessPayments: boolean;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            profileCompleted: true,
            documentsCompleted: true,
        },
    });

    if (!user) {
        return {
            profileCompleted: false,
            documentsCompleted: false,
            canAccessDocuments: false,
            canAccessPayments: false,
        };
    }

    return {
        profileCompleted: user.profileCompleted,
        documentsCompleted: user.documentsCompleted,
        canAccessDocuments: user.profileCompleted,
        canAccessPayments: user.profileCompleted && user.documentsCompleted,
    };
}

/**
 * Notifica a los administradores si el usuario completó sus documentos
 */
async function notifyAdminsOfCompletion(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastNamePaterno: true }
        });

        if (!user) return;

        const userName = `${user.firstName || ''} ${user.lastNamePaterno || ''}`.trim();

        // Buscar admins
        const admins = await prisma.user.findMany({
            where: {
                role: { in: ['SUPERADMIN', 'AUDITOR'] }
            }
        });

        // Crear notificaciones
        await prisma.notification.createMany({
            data: admins.map(admin => ({
                userId: admin.id,
                type: 'INFO',
                title: 'Legajo Completado',
                message: `El alumno ${userName} ha subido todos sus documentos.`,
                read: false
            }))
        });

        console.log(`Notified ${admins.length} admins about user ${userId} completion.`);

    } catch (error) {
        console.error("Error notifying admins:", error);
    }
}
