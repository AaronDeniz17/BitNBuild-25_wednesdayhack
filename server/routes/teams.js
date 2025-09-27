// Team routes for GigCampus
// Handles team creation, management, and collaboration

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole, requireUniversityVerification } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/teams
 * Create a new team (students only)
 */
router.post('/', authenticateToken, requireRole(['student']), requireUniversityVerification, async (req, res) => {
  try {
    const { name, description, skills } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    // Check if team name already exists
    const existingTeamQuery = await admin.firestore()
      .collection('teams')
      .where('name', '==', name)
      .get();

    if (!existingTeamQuery.empty) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    // Create team
    const teamData = {
      id: admin.firestore().collection('teams').doc().id,
      name,
      leader_id: req.user.id,
      member_ids: [req.user.id], // Leader is automatically a member
      skills: skills || [],
      team_wallet_balance: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true,
      description: description || '',
      portfolio_links: [],
      reputation_score: 0,
      completed_projects: 0
    };

    await admin.firestore()
      .collection('teams')
      .doc(teamData.id)
      .set(teamData);

    res.status(201).json({
      message: 'Team created successfully',
      team: teamData
    });

  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/**
 * GET /api/teams
 * Get teams for current user or all teams
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type = 'my' } = req.query;
    const userId = req.user.id;

    let teams = [];

    if (type === 'my') {
      // Get teams where user is a member
      const teamsSnapshot = await admin.firestore()
        .collection('teams')
        .where('member_ids', 'array-contains', userId)
        .get();

      teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      }));
    } else if (type === 'all') {
      // Get all active teams
      const teamsSnapshot = await admin.firestore()
        .collection('teams')
        .where('is_active', '==', true)
        .orderBy('reputation_score', 'desc')
        .limit(20)
        .get();

      teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      }));
    }

    // Enrich team data with member information
    const enrichedTeams = await Promise.all(
      teams.map(async (team) => {
        const memberPromises = team.member_ids.map(async (memberId) => {
          const memberDoc = await admin.firestore()
            .collection('users')
            .doc(memberId)
            .get();

          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            return {
              id: memberData.id,
              name: memberData.name,
              email: memberData.email,
              is_leader: memberId === team.leader_id
            };
          }
          return null;
        });

        const members = (await Promise.all(memberPromises)).filter(Boolean);

        return {
          ...team,
          members,
          member_count: members.length
        };
      })
    );

    res.json({ teams: enrichedTeams });

  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * GET /api/teams/:id
 * Get team details by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Get member details
    const memberPromises = teamData.member_ids.map(async (memberId) => {
      const memberDoc = await admin.firestore()
        .collection('users')
        .doc(memberId)
        .get();

      if (memberDoc.exists) {
        const memberData = memberDoc.data();
        
        // Get student profile if applicable
        let studentProfile = null;
        if (memberData.role === 'student') {
          const studentDoc = await admin.firestore()
            .collection('student_profiles')
            .doc(memberId)
            .get();

          if (studentDoc.exists) {
            studentProfile = studentDoc.data();
          }
        }

        return {
          id: memberData.id,
          name: memberData.name,
          email: memberData.email,
          is_leader: memberId === teamData.leader_id,
          studentProfile: studentProfile ? {
            skills: studentProfile.skills,
            hourly_rate: studentProfile.hourly_rate,
            reputation_score: studentProfile.reputation_score
          } : null
        };
      }
      return null;
    });

    const members = (await Promise.all(memberPromises)).filter(Boolean);

    res.json({
      team: {
        id: teamDoc.id,
        ...teamData,
        created_at: teamData.created_at?.toDate(),
        members,
        member_count: members.length
      }
    });

  } catch (error) {
    console.error('Team fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

/**
 * POST /api/teams/:id/join
 * Join a team (students only)
 */
router.post('/:id/join', authenticateToken, requireRole(['student']), requireUniversityVerification, async (req, res) => {
  try {
    const teamId = req.params.id;

    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Check if team is active
    if (!teamData.is_active) {
      return res.status(400).json({ error: 'Team is not active' });
    }

    // Check if user is already a member
    if (teamData.member_ids.includes(req.user.id)) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Check team size limit (max 10 members for MVP)
    if (teamData.member_ids.length >= 10) {
      return res.status(400).json({ error: 'Team is at maximum capacity' });
    }

    // Add user to team
    await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .update({
        member_ids: admin.firestore.FieldValue.arrayUnion(req.user.id)
      });

    res.json({ message: 'Successfully joined team' });

  } catch (error) {
    console.error('Team join error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

/**
 * POST /api/teams/:id/leave
 * Leave a team
 */
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Check if user is a member
    if (!teamData.member_ids.includes(req.user.id)) {
      return res.status(400).json({ error: 'You are not a member of this team' });
    }

    // Check if user is the leader
    if (teamData.leader_id === req.user.id) {
      return res.status(400).json({ error: 'Team leader cannot leave. Transfer leadership first.' });
    }

    // Remove user from team
    await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .update({
        member_ids: admin.firestore.FieldValue.arrayRemove(req.user.id)
      });

    res.json({ message: 'Successfully left team' });

  } catch (error) {
    console.error('Team leave error:', error);
    res.status(500).json({ error: 'Failed to leave team' });
  }
});

/**
 * PUT /api/teams/:id/transfer-leadership
 * Transfer team leadership (current leader only)
 */
router.put('/:id/transfer-leadership', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { new_leader_id } = req.body;

    if (!new_leader_id) {
      return res.status(400).json({ error: 'New leader ID is required' });
    }

    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Check if user is the current leader
    if (teamData.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can transfer leadership' });
    }

    // Check if new leader is a team member
    if (!teamData.member_ids.includes(new_leader_id)) {
      return res.status(400).json({ error: 'New leader must be a team member' });
    }

    // Transfer leadership
    await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .update({
        leader_id: new_leader_id
      });

    res.json({ message: 'Leadership transferred successfully' });

  } catch (error) {
    console.error('Leadership transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer leadership' });
  }
});

/**
 * PUT /api/teams/:id/update
 * Update team information (leader only)
 */
router.put('/:id/update', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const updates = req.body;

    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Check if user is the team leader
    if (teamData.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can update team information' });
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.leader_id;
    delete updates.member_ids;
    delete updates.created_at;

    // Update team
    await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .update({
        ...updates,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Team updated successfully' });

  } catch (error) {
    console.error('Team update error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/**
 * GET /api/teams/:id/wallet
 * Get team wallet information (members only)
 */
router.get('/:id/wallet', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // Check if user is a team member
    if (!teamData.member_ids.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get team transactions
    const transactionsSnapshot = await admin.firestore()
      .collection('transactions')
      .where('to_id', '==', teamId)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        processed_at: doc.data().processed_at?.toDate()
      });
    });

    res.json({
      team_wallet: {
        balance: teamData.team_wallet_balance,
        team_id: teamId,
        team_name: teamData.name
      },
      transactions
    });

  } catch (error) {
    console.error('Team wallet fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch team wallet' });
  }
});

module.exports = router;
