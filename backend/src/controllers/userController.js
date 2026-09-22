const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
    try {
        const { roleSlug, agencyId } = req.user;
        
        let users;

        // RBAC Logic
        if (roleSlug === 'superadmin') {
            users = await prisma.user.findMany({
                include: {
                    role: true,
                    agency: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (roleSlug === 'agency_admin') {
            users = await prisma.user.findMany({
                where: { agencyId: agencyId },
                include: {
                    role: true,
                    agency: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        // Sanitize response: NEVER return passwordHash
        const sanitizedUsers = users.map(user => {
            const { passwordHash, ...safeUser } = user;
            return {
                ...safeUser,
                // Flattening useful relations for the frontend
                roleSlug: safeUser.role.slug,
                roleName: safeUser.role.roleName,
                agencyName: safeUser.agency.name
            };
        });

        res.json(sanitizedUsers);

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleSlug, agencyId } = req.user;

        const userToToggle = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!userToToggle) {
            return res.status(404).json({ error: 'User not found' });
        }

        // RBAC Logic
        if (roleSlug !== 'superadmin' && (roleSlug !== 'agency_admin' || userToToggle.agencyId !== agencyId)) {
             return res.status(403).json({ error: 'Access denied. You can only modify users in your own agency.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { isActive: !userToToggle.isActive },
            include: { role: true, agency: true }
        });
        
        const { passwordHash, ...safeUser } = updatedUser;
        res.json({
            ...safeUser,
            roleSlug: safeUser.role.slug,
            roleName: safeUser.role.roleName,
            agencyName: safeUser.agency.name
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleSlug, agencyId } = req.user;
        const { username, email, designation, roleId, agencyId: targetAgencyId } = req.body;

        const userToUpdate = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        // RBAC Logic
        if (roleSlug !== 'superadmin' && (roleSlug !== 'agency_admin' || userToUpdate.agencyId !== agencyId)) {
             return res.status(403).json({ error: 'Access denied. You can only modify users in your own agency.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                username,
                email,
                designation,
                roleId: roleId ? parseInt(roleId) : undefined,
                agencyId: targetAgencyId ? parseInt(targetAgencyId) : undefined
            },
            include: { role: true, agency: true }
        });

        const { passwordHash, ...safeUser } = updatedUser;
        res.json({
            ...safeUser,
            roleSlug: safeUser.role.slug,
            roleName: safeUser.role.roleName,
            agencyName: safeUser.agency.name
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const changeUserApprovalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { roleSlug, agencyId } = req.user;

        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const userToUpdate = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        // RBAC Logic
        if (roleSlug !== 'superadmin' && (roleSlug !== 'agency_admin' || userToUpdate.agencyId !== agencyId)) {
             return res.status(403).json({ error: 'Access denied. You can only modify users in your own agency.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { status },
            include: { role: true, agency: true }
        });
        
        const { passwordHash, ...safeUser } = updatedUser;
        res.json({
            ...safeUser,
            roleSlug: safeUser.role.slug,
            roleName: safeUser.role.roleName,
            agencyName: safeUser.agency.name
        });
    } catch (error) {
        console.error('Error changing user approval status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllUsers,
    toggleUserStatus,
    updateUser,
    changeUserApprovalStatus
};
