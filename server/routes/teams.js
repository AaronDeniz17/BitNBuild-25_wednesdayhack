// Teams routes for GigCampus
// Handles team creation, joining, management, and role assignment

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/teams
 * Create a new team
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, skills } = req.body;

    // Validate inputs
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Team name must be at least 3 characters long'
      });
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can create teams'
      });
    }

    const teamId = uuidv4();
    const teamData = {
      id: teamId,
      name: name.trim(),
      description: description?.trim() || '',
      owner_id: req.user.id,
      skills: skills || [],
      team_wallet_balance: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true,
      portfolio_links: [],
      reputation_score: 0,
      completed_projects: 0
    };

    // Create team
    await db.collection('teams').doc(teamId).set(teamData);

    // Add owner as team member with 'lead' role
    const memberId = uuidv4();
    const memberData = {
      id: memberId,
      team_id: teamId,
      user_id: req.user.id,
      role: 'lead',
      joined_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true
    };

    await db.collection('team_members').doc(memberId).set(memberData);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        ...teamData,
        members: [{
          id: memberId,
          user_id: req.user.id,
          role: 'lead',
          joined_at: new Date()
        }]
      }
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/teams
 * Get teams (with filters)
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      skills, 
      owner_id,
      my_teams = false 
    } = req.query;

    let query = db.collection('teams').where('is_active', '==', true);

    // Filter by owner if specified
    if (owner_id) {
      query = query.where('owner_id', '==', owner_id);
    }

    // Filter by user's teams if requested
    if (my_teams === 'true') {
      // Get teams where user is a member
      const memberSnapshot = await db.collection('team_members')
        .where('user_id', '==', req.user.id)
        .where('is_active', '==', true)
        .get();

      const teamIds = memberSnapshot.docs.map(doc => doc.data().team_id);
      
      if (teamIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 }
        });
      }

      // Note: Firestore 'in' queries are limited to 10 items
      if (teamIds.length <= 10) {
        query = query.where('id', 'in', teamIds);
      } else {
        // For more than 10 teams, we'll need to fetch all and filter client-side
        query = db.collection('teams').where('is_active', '==', true);
      }
    }

    query = query.orderBy('created_at', 'desc');

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    let teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by search term and skills if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      teams = teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm) ||
        team.description.toLowerCase().includes(searchTerm)
      );
    }

    if (skills && Array.isArray(skills)) {
      teams = teams.filter(team => 
        team.skills && team.skills.some(skill => 
          skills.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }

    // Get team members for each team
    const teamsWithMembers = await Promise.all(teams.map(async (team) => {
      const membersSnapshot = await db.collection('team_members')
        .where('team_id', '==', team.id)
        .where('is_active', '==', true)
        .get();

      const members = await Promise.all(membersSnapshot.docs.map(async (doc) => {
        const memberData = doc.data();
        const userDoc = await db.collection('users').doc(memberData.user_id).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        return {
          id: doc.id,
          ...memberData,
          user: userData ? {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            skills: userData.skills || []
          } : null
        };
      }));

      return {
        ...team,
        members,
        member_count: members.length
      };
    }));

    res.json({
      success: true,
      data: teamsWithMembers,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: teamsWithMembers.length,
        pages: Math.ceil(teamsWithMembers.length / pageSize)
      }
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get teams',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/teams/:id
 * Get team details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const teamData = teamDoc.data();

    // Get team members
    const membersSnapshot = await db.collection('team_members')
      .where('team_id', '==', id)
      .where('is_active', '==', true)
      .get();

    const members = await Promise.all(membersSnapshot.docs.map(async (doc) => {
      const memberData = doc.data();
      const userDoc = await db.collection('users').doc(memberData.user_id).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      return {
        id: doc.id,
        ...memberData,
        user: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          skills: userData.skills || [],
          profile_picture: userData.profile_picture
        } : null
      };
    }));

    // Check if user is a member
    const isMember = members.some(member => member.user_id === req.user.id);
    const userRole = isMember ? members.find(member => member.user_id === req.user.id)?.role : null;

    res.json({
      success: true,
      data: {
        ...teamData,
        members,
        member_count: members.length,
        is_member: isMember,
        user_role: userRole
      }
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/teams/:id/join
 * Join a team
 */
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can join teams'
      });
    }

    // Get team
    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const teamData = teamDoc.data();

    // Check if team is active
    if (!teamData.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Team is not active'
      });
    }

    // Check if user is already a member
    const existingMemberSnapshot = await db.collection('team_members')
      .where('team_id', '==', id)
      .where('user_id', '==', req.user.id)
      .where('is_active', '==', true)
      .get();

    if (!existingMemberSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of this team'
      });
    }

    // Add user as team member
    const memberId = uuidv4();
    const memberData = {
      id: memberId,
      team_id: id,
      user_id: req.user.id,
      role: 'member',
      joined_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true
    };

    await db.collection('team_members').doc(memberId).set(memberData);

    res.json({
      success: true,
      message: 'Successfully joined team',
      data: {
        team_id: id,
        team_name: teamData.name,
        role: 'member'
      }
    });

  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join team',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/teams/:id/leave
 * Leave a team
 */
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get team
    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const teamData = teamDoc.data();

    // Check if user is the owner
    if (teamData.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Team owner cannot leave the team. Transfer ownership or delete the team instead.'
      });
    }

    // Find and deactivate user's membership
    const memberSnapshot = await db.collection('team_members')
      .where('team_id', '==', id)
      .where('user_id', '==', req.user.id)
      .where('is_active', '==', true)
      .get();

    if (memberSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'You are not a member of this team'
      });
    }

    // Deactivate membership
    const memberDoc = memberSnapshot.docs[0];
    await db.collection('team_members').doc(memberDoc.id).update({
      is_active: false,
      left_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Successfully left team'
    });

  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave team',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/teams/:id/members/:memberId/role
 * Update team member role
 */
router.put('/:id/members/:memberId/role', auth, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!['member', 'lead'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "member" or "lead"'
      });
    }

    // Get team
    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const teamData = teamDoc.data();

    // Check if user is team owner
    if (teamData.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only team owner can change member roles'
      });
    }

    // Get member
    const memberDoc = await db.collection('team_members').doc(memberId).get();
    
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    const memberData = memberDoc.data();

    // Verify member belongs to this team
    if (memberData.team_id !== id) {
      return res.status(400).json({
        success: false,
        error: 'Member does not belong to this team'
      });
    }

    // Update role
    await db.collection('team_members').doc(memberId).update({
      role,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/teams/:id/members/:memberId
 * Remove member from team
 */
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const { id, memberId } = req.params;

    // Get team
    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const teamData = teamDoc.data();

    // Check if user is team owner
    if (teamData.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only team owner can remove members'
      });
    }

    // Get member
    const memberDoc = await db.collection('team_members').doc(memberId).get();
    
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    const memberData = memberDoc.data();

    // Verify member belongs to this team
    if (memberData.team_id !== id) {
      return res.status(400).json({
        success: false,
        error: 'Member does not belong to this team'
      });
    }

    // Deactivate membership
    await db.collection('team_members').doc(memberId).update({
      is_active: false,
      removed_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Member removed from team successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/teams/:id/wallet
 * Get team wallet balance
 */
router.get('/:id/wallet', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get team
    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const teamData = teamDoc.data();

    // Check if user is a team member
    const memberSnapshot = await db.collection('team_members')
      .where('team_id', '==', id)
      .where('user_id', '==', req.user.id)
      .where('is_active', '==', true)
      .get();

    if (memberSnapshot.empty) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this team.'
      });
    }

    res.json({
      success: true,
      data: {
        team_id: id,
        team_name: teamData.name,
        wallet_balance: teamData.team_wallet_balance || 0
      }
    });

  } catch (error) {
    console.error('Get team wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team wallet',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;