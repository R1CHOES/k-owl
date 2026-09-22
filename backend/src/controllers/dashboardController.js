const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
    try {
        const { roleSlug, agencyId } = req.user;
        
        let userWhereClause = {};
        let agencyWhereClause = {};

        // RBAC Logic
        if (roleSlug === 'focal_person') {
            userWhereClause = { agencyId };
            agencyWhereClause = { id: agencyId };
        } else if (roleSlug !== 'superadmin' && roleSlug !== 'kbm') {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const [totalUsers, activeUsers, totalAgencies, recentUsers] = await Promise.all([
            prisma.user.count({ where: userWhereClause }),
            prisma.user.count({ where: { ...userWhereClause, isActive: true } }),
            prisma.agency.count({ where: agencyWhereClause }),
            prisma.user.findMany({
                where: userWhereClause,
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { role: true, agency: true }
            })
        ]);

        // Sanitize recent users
        const sanitizedRecentUsers = recentUsers.map(u => {
            const { passwordHash, ...safeUser } = u;
            return safeUser;
        });

        res.json({
            totalUsers,
            activeUsers,
            totalAgencies,
            recentUsers: sanitizedRecentUsers
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getDashboardStats
};
