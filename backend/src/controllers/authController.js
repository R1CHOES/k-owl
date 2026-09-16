const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user by email, include role and agency
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        agency: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign a JWT
    const payload = {
      userId: user.id,
      roleSlug: user.role.slug,
      agencyId: user.agencyId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '1d', // optional expiration
    });

    // Exclude passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, designation, roleId, agencyId } = req.body;
    const currentUser = req.user; // Attached by authMiddleware

    // 1. Role-Based Access Control (RBAC) Logic
    if (currentUser.roleSlug === 'super-admin') {
      // Super-admins can create any user across any agency, proceed.
    } else if (currentUser.roleSlug === 'agency-focal-person') {
      // Agency Focal Persons can only create users for their own agency
      if (agencyId !== currentUser.agencyId) {
        return res.status(403).json({ error: 'Forbidden: Cannot create users for other agencies' });
      }

      // Fetch the role they are trying to assign to ensure it's allowed
      const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (!targetRole) {
        return res.status(400).json({ error: 'Invalid roleId provided' });
      }

      // Block creating higher-privileged roles
      const forbiddenRoles = ['super-admin', 'knowledge-base-manager'];
      if (forbiddenRoles.includes(targetRole.slug)) {
        return res.status(403).json({ error: 'Forbidden: Cannot assign super-admin or knowledge-base-manager roles' });
      }
    } else {
      // Any other role (e.g., standard user) is strictly forbidden from creating users
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to create users' });
    }

    // 2. Validate input constraints (basic check)
    if (!username || !email || !password || !roleId || !agencyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Save the new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        designation,
        roleId,
        agencyId
      }
    });

    // Exclude the password hash from the response
    const { passwordHash: _hash, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  register,
};
