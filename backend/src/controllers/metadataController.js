const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAgencies = async (req, res) => {
  try {
    const agencies = await prisma.agency.findMany({
      select: { id: true, name: true }
    });
    res.json(agencies);
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, roleName: true, slug: true }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAgencies,
  getRoles
};
