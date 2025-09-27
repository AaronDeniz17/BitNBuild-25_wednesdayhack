// Teams routes for GigCampus
// Handles team creation, joining, management, and collaboration

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, requireUniversityVerification, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Team role constants
const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
};

/**
 * GET /api/teams
 * Get all public teams with filtering
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      skills, 
      university, 
      size_min, 
      size_max,
      search 
    } = req.query;

    let query = db.collection('teams')
      .where('is_public', '==', true)
      .where('is_accepting_members', '==', true);

    // Apply filters
    if (university) {
      query = query.where('university', '==', university);
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query = query.where('skills_needed', 'array-contains-any', skillsArray);
    }

    query = query.orderBy('created_at', 'desc');

    // Pagination
    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const teams = [];

    for (const doc of snapshot.docs) {
      const teamData = doc.data();
      
      // Text search filtering (simple implementation)
      if (search) {
        const searchTerm = search.toLowerCase();
        const nameMatch = teamData.name?.toLowerCase().includes(searchTerm);
        const descMatch = teamData.description?.toLowerCase().includes(searchTerm);
        
        if (!nameMatch && !descMatch) {
          continue;
        }
      }

      // Size filtering
      const currentSize = teamData.member_count || 0;
      if (size_min && currentSize < parseInt(size_min)) continue;
      if (size_max && currentSize > parseInt(size_max)) continue;

      // Get owner info
      const ownerDoc = await db.collection('users').doc(teamData.owner_id).get();
      const ownerData = ownerDoc.exists ? ownerDoc.data() : null;

      teams.push({
        id: doc.id,
        ...teamData,
        owner: ownerData ? {
          id: ownerData.id,
          name: ownerData.name,
          university: ownerData.university,
          university_verified: ownerData.university_verified
        } : null
      });
    }

    res.json({
      success: true,
      data: teams,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: teams.length // This is approximate for simplicity
      }
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

/**
 * GET /api/teams/my
 * Get current user's teams
 */
router.get('/my', auth, async (req, res) => {
  try {
    // Get teams where user is a member
    const membershipSnapshot = await db.collection('team_members')
      .where('user_id', '==', req.user.id)
      .get();

    const teamIds = membershipSnapshot.docs.map(doc => doc.data().team_id);
    
    if (teamIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get team details
    const teams = [];
    
    for (const teamId of teamIds) {
      const teamDoc = await db.collection('teams').doc(teamId).get();
      
      if (teamDoc.exists) {
        const teamData = teamDoc.data();
        
        // Get user's role in this team
        const memberDoc = membershipSnapshot.docs.find(doc => doc.data().team_id === teamId);
        const userRole = memberDoc ? memberDoc.data().role : 'member';
        
        teams.push({
          id: teamId,
          ...teamData,
          user_role: userRole
        });
      }
    }

    res.json({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(500).json({ error: 'Failed to get your teams' });
  }
});

/**
 * GET /api/teams/:id
 * Get specific team by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Check if team is public or user is a member
    const isMember = await checkTeamMembership(id, req.user.id);
    
    if (!teamData.is_public && !isMember) {
      return res.status(403).json({ error: 'This team is private' });
    }

    // Get team members
    const membersSnapshot = await db.collection('team_members')
      .where('team_id', '==', id)
      .get();

    const members = [];
    
    for (const doc of membersSnapshot.docs) {
      const memberData = doc.data();
      
      // Get user info
      const userDoc = await db.collection('users').doc(memberData.user_id).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      if (userData) {
        members.push({
          id: memberData.user_id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified,
          skills: userData.skills || [],
          role: memberData.role,
          joined_at: memberData.joined_at
        });
      }
    }

    // Get owner info
    const ownerDoc = await db.collection('users').doc(teamData.owner_id).get();
    const ownerData = ownerDoc.exists ? ownerDoc.data() : null;

    // Get user's role if they're a member
    const userRole = isMember ? 
      members.find(m => m.id === req.user.id)?.role || 'member' : 
      null;

    const team = {
      id,
      ...teamData,
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        university: ownerData.university,
        university_verified: ownerData.university_verified
      } : null,
      members,
      user_role: userRole,
      is_member: isMember
    };

    res.json({
      success: true,
      data: team
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team' });
  }
});

/**
 * POST /api/teams
 * Create a new team
 */
router.post('/', auth, requireUniversityVerification, userRateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const {
      name,
      description,
      skills_needed,
      max_members = 10,
      is_public = true,
      university,
      looking_for
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'description']
      });
    }

    // Validate name length
    if (name.trim().length < 3) {
      return res.status(400).json({ error: 'Team name must be at least 3 characters long' });
    }

    // Validate description length
    if (description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long' });
    }

    // Validate max members
    if (max_members < 2 || max_members > 50) {
      return res.status(400).json({ error: 'Max members must be between 2 and 50' });
    }

    // Check user's current team count
    const currentTeamsSnapshot = await db.collection('team_members')
      .where('user_id', '==', req.user.id)
      .where('role', 'in', ['owner', 'admin'])
      .get();

    if (currentTeamsSnapshot.size >= 3) {
      return res.status(400).json({ 
        error: 'You can only own/admin up to 3 teams' 
      });
    }

    const teamId = uuidv4();
    
    const newTeam = {
      id: teamId,
      owner_id: req.user.id,
      name: name.trim(),
      description: description.trim(),
      skills_needed: skills_needed || [],
      max_members: parseInt(max_members),
      member_count: 1, // Owner is first member
      is_public: Boolean(is_public),
      is_accepting_members: true,
      university: university || req.user.university,
      looking_for: looking_for || '',
      
      // Metadata
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      
      // Stats
      completed_projects: 0,
      total_earnings: 0,
      average_rating: 0
    };

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Create team
      transaction.set(db.collection('teams').doc(teamId), newTeam);
      
      // Add owner as first member
      const memberData = {
        team_id: teamId,
        user_id: req.user.id,
        role: TEAM_ROLES.OWNER,
        joined_at: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.set(
        db.collection('team_members').doc(`${teamId}_${req.user.id}`),
        memberData
      );
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { id: teamId, ...newTeam }
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/**
 * PUT /api/teams/:id
 * Update team (only by owner/admin)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if user can update this team
    const canUpdate = await checkTeamPermission(id, req.user.id, ['owner', 'admin']);
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'You can only update teams you own or admin' });
    }

    // Allowed fields to update
    const allowedFields = [
      'name', 'description', 'skills_needed', 'max_members',
      'is_public', 'is_accepting_members', 'looking_for'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'name' && updates[field].trim().length < 3) {
          return res.status(400).json({ error: 'Team name must be at least 3 characters long' });
        }
        if (field === 'description' && updates[field].trim().length < 10) {
          return res.status(400).json({ error: 'Description must be at least 10 characters long' });
        }
        if (field === 'max_members') {
          const maxMembers = parseInt(updates[field]);
          if (maxMembers < 2 || maxMembers > 50) {
            return res.status(400).json({ error: 'Max members must be between 2 and 50' });
          }
          updateData[field] = maxMembers;
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('teams').doc(id).update(updateData);

    // Get updated team
    const updatedTeamDoc = await db.collection('teams').doc(id).get();

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: { id, ...updatedTeamDoc.data() }
    });

  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/**
 * POST /api/teams/:id/join
 * Join a team
 */
router.post('/:id/join', auth, requireUniversityVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const teamDoc = await db.collection('teams').doc(id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamDoc.data();

    // Check if team is accepting members
    if (!team.is_accepting_members) {
      return res.status(400).json({ error: 'Team is not accepting new members' });
    }

    // Check if team is full
    if (team.member_count >= team.max_members) {
      return res.status(400).json({ error: 'Team is full' });
    }

    // Check if user is already a member
    const existingMember = await db.collection('team_members')
      .doc(`${id}_${req.user.id}`)
      .get();

    if (existingMember.exists) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Check user's current team count
    const currentTeamsSnapshot = await db.collection('team_members')
      .where('user_id', '==', req.user.id)
      .get();

    if (currentTeamsSnapshot.size >= 5) {
      return res.status(400).json({ 
        error: 'You can only be a member of up to 5 teams' 
      });
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Add user as team member
      const memberData = {
        team_id: id,
        user_id: req.user.id,
        role: TEAM_ROLES.MEMBER,
        joined_at: admin.firestore.FieldValue.serverTimestamp(),
        join_message: message || ''
      };
      
      transaction.set(
        db.collection('team_members').doc(`${id}_${req.user.id}`),
        memberData
      );
      
      // Update team member count
      transaction.update(db.collection('teams').doc(id), {
        member_count: admin.firestore.FieldValue.increment(1),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({
      success: true,
      message: 'Successfully joined the team'
    });

  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

/**
 * POST /api/teams/:id/leave
 * Leave a team
 */
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a member
    const memberDoc = await db.collection('team_members')
      .doc(`${id}_${req.user.id}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(400).json({ error: 'You are not a member of this team' });
    }

    const memberData = memberDoc.data();

    // Owner cannot leave (must transfer ownership first)
    if (memberData.role === TEAM_ROLES.OWNER) {
      return res.status(400).json({ 
        error: 'Team owner cannot leave. Transfer ownership first or delete the team.' 
      });
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Remove user from team
      transaction.delete(db.collection('team_members').doc(`${id}_${req.user.id}`));
      
      // Update team member count
      transaction.update(db.collection('teams').doc(id), {
        member_count: admin.firestore.FieldValue.increment(-1),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({
      success: true,
      message: 'Successfully left the team'
    });

  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ error: 'Failed to leave team' });
  }
});

/**
 * POST /api/teams/:id/remove-member
 * Remove a member from team (only by owner/admin)
 */
router.post('/:id/remove-member', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user can remove members
    const canRemove = await checkTeamPermission(id, req.user.id, ['owner', 'admin']);
    
    if (!canRemove) {
      return res.status(403).json({ error: 'You can only remove members from teams you own or admin' });
    }

    // Cannot remove yourself
    if (user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself. Use leave endpoint instead.' });
    }

    // Check if target user is a member
    const memberDoc = await db.collection('team_members')
      .doc(`${id}_${user_id}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(400).json({ error: 'User is not a member of this team' });
    }

    const memberData = memberDoc.data();

    // Cannot remove owner
    if (memberData.role === TEAM_ROLES.OWNER) {
      return res.status(400).json({ error: 'Cannot remove team owner' });
    }

    // Only owner can remove admins
    if (memberData.role === TEAM_ROLES.ADMIN) {
      const isOwner = await checkTeamPermission(id, req.user.id, ['owner']);
      if (!isOwner) {
        return res.status(403).json({ error: 'Only team owner can remove admins' });
      }
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Remove user from team
      transaction.delete(db.collection('team_members').doc(`${id}_${user_id}`));
      
      // Update team member count
      transaction.update(db.collection('teams').doc(id), {
        member_count: admin.firestore.FieldValue.increment(-1),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * DELETE /api/teams/:id
 * Delete team (only by owner)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is the owner
    const isOwner = await checkTeamPermission(id, req.user.id, ['owner']);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Only team owner can delete the team' });
    }

    // Delete team and all related data
    const batch = db.batch();
    
    // Delete team
    batch.delete(db.collection('teams').doc(id));
    
    // Delete all team members
    const membersSnapshot = await db.collection('team_members')
      .where('team_id', '==', id)
      .get();
    
    membersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Helper function to check team membership
async function checkTeamMembership(teamId, userId) {
  try {
    const memberDoc = await db.collection('team_members')
      .doc(`${teamId}_${userId}`)
      .get();
    return memberDoc.exists;
  } catch (error) {
    return false;
  }
}

// Helper function to check team permissions
async function checkTeamPermission(teamId, userId, allowedRoles) {
  try {
    const memberDoc = await db.collection('team_members')
      .doc(`${teamId}_${userId}`)
      .get();
    
    if (!memberDoc.exists) return false;
    
    const memberData = memberDoc.data();
    return allowedRoles.includes(memberData.role);
  } catch (error) {
    return false;
  }
}

module.exports = router;