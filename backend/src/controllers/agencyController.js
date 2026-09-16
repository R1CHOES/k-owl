const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllAgencies = async (req, res) => {
    try {
        const agencies = await prisma.agency.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(agencies);
    } catch (error) {
        console.error('Error fetching agencies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createAgency = async (req, res) => {
    try {
        if (req.user.roleSlug !== 'super-admin') {
            return res.status(403).json({ error: 'Access denied. Super Admin only.' });
        }
        
        const { name, description, address, website, bannerUrl, logoUrl } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Agency name is required' });
        }

        const newAgency = await prisma.agency.create({
            data: { name, description, address, website, bannerUrl, logoUrl }
        });

        res.status(201).json(newAgency);
    } catch (error) {
        console.error('Error creating agency:', error);
        if (error.code === 'P2002') {
             return res.status(400).json({ error: 'Agency name already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateAgency = async (req, res) => {
    try {
        if (req.user.roleSlug !== 'super-admin') {
            return res.status(403).json({ error: 'Access denied. Super Admin only.' });
        }
        
        const { id } = req.params;
        const { name, description, address, website, bannerUrl, logoUrl } = req.body;

        const updatedAgency = await prisma.agency.update({
            where: { id: parseInt(id) },
            data: { name, description, address, website, bannerUrl, logoUrl }
        });

        res.json(updatedAgency);
    } catch (error) {
        console.error('Error updating agency:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Agency not found' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllAgencies,
    createAgency,
    updateAgency
};
