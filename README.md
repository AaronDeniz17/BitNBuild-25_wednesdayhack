# BitNBuild - Enhanced Freelance Platform

## Project Abstract
BitNBuild is an innovative freelance marketplace platform designed specifically for university students and early-career professionals. It combines advanced project matching algorithms with secure payment handling and real-time collaboration tools to create a comprehensive ecosystem for skill development and project execution.

The platform addresses several key challenges in the student freelancing space:
- Skill-to-project matching for inexperienced freelancers
- Secure payment handling for first-time contractors
- Portfolio building opportunities for students
- Real-time skill trend analysis for career guidance
- Team formation and collaboration for larger projects

## Domain and Tools Used

### Frontend Technologies
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS, Heroicons
- **State Management**: React Query, Context API
- **Authentication**: Firebase Auth
- **Real-time Features**: Firebase Realtime Database
- **UI Components**: Custom components with dark/light mode support

### Backend Technologies
- **Server**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Storage**: Supabase Storage
- **Authentication**: Firebase Admin SDK
- **Security**: 
  - JWT token authentication
  - Rate limiting
  - CORS protection
  - Request validation

### Development Tools
- **Version Control**: Git & GitHub
- **Package Management**: npm
- **Code Quality**: ESLint, Prettier
- **Environment**: dotenv for configuration
- **Testing**: Jest for unit testing

### Key Features

#### Core Platform Features
- 👥 **Advanced User Authentication**
  - Role-based access control (Student, Client, Admin)
  - Secure JWT-based sessions
  - OAuth integration with academic emails

- 💼 **Intelligent Project Management**
  - Automated skill-based project matching
  - Milestone tracking and management
  - Project timeline visualization
  - File sharing and version control
  - Real-time progress updates

- 💰 **Secure Payment System**
  - Escrow-based payment protection
  - Milestone-linked payments
  - Transaction history tracking
  - Multiple payment method support
  - Automated invoice generation

#### Collaboration Tools
- 💬 **Enhanced Communication**
  - Real-time chat with file sharing
  - Project-specific chat rooms
  - Notification system
  - Meeting scheduler integration

- 👥 **Team Collaboration**
  - Team formation assistance
  - Role assignment and management
  - Skill complementarity matching
  - Team performance analytics

#### Analytics and Insights
- 📊 **Comprehensive Analytics**
  - Earnings and performance tracking
  - Skill development metrics
  - Market demand analysis
  - Project success rate tracking

#### User Experience
- 📱 **Enhanced UI/UX**
  - Responsive design across devices
  - Dark/Light mode support
  - Intuitive navigation
  - Accessibility compliance
  - Real-time updates and notifications

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm 8.x or higher
- Firebase account with Firestore enabled
- Supabase account for storage
- Git for version control

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/BitNBuild.git
cd BitNBuild
```

2. Set up environment variables:

For client (in client/.env):
```plaintext
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For server (in server/.env):
```plaintext
PORT=3001
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

3. Install dependencies:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Development Scripts

Frontend (in client directory):
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

Backend (in server directory):
- `npm run dev`: Start development server
- `npm run start`: Start production server
- `npm test`: Run tests
- `npm run seed`: Seed the database

## Project Architecture

### Frontend Structure
```
client/
├── components/     # Reusable UI components
├── contexts/       # React contexts for state management
├── lib/           # Utility functions and API clients
├── pages/         # Next.js pages and routing
└── styles/        # Global styles and Tailwind config
```

### Backend Structure
```
server/
├── config/        # Configuration files
├── middleware/    # Express middleware
├── models/        # Data models and schemas
├── routes/        # API route handlers
├── services/      # Business logic and external services
├── tests/         # Test files
└── utils/         # Utility functions
```

### Key Architecture Points

1. **Frontend Architecture**
   - Next.js for server-side rendering and routing
   - React Query for server state management
   - Context API for global state
   - Component-based structure with reusable UI elements
   - Responsive design with Tailwind CSS

2. **Backend Architecture**
   - Express.js RESTful API
   - Modular route structure
   - Service-based business logic
   - Middleware for authentication and request processing
   - Firebase Admin SDK for secure operations

3. **Database Design**
   - Firestore collections for main data storage
   - Supabase for file storage
   - Efficient querying with proper indexing
   - Real-time data synchronization

4. **Security Measures**
   - JWT-based authentication
   - Role-based access control
   - Input validation and sanitization
   - Rate limiting and CORS protection

## Contributing

We welcome contributions to BitNBuild! Here's how you can help:

1. **Fork the Repository**
   - Create your feature branch: `git checkout -b feature/AmazingFeature`
   - Commit your changes: `git commit -m 'Add some AmazingFeature'`
   - Push to the branch: `git push origin feature/AmazingFeature`
   - Open a Pull Request

2. **Coding Standards**
   - Follow the existing code style
   - Write meaningful commit messages
   - Add appropriate comments and documentation
   - Ensure all tests pass

3. **Testing**
   - Add tests for new features
   - Ensure existing tests pass
   - Test across different devices and browsers

4. **Documentation**
   - Update README.md if needed
   - Document new features and changes
   - Add comments for complex logic

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@bitnbuild.com or join our Discord channel.

### Advanced Features
- **Multi-budget Support**: Fixed price or range-based project budgets
- **Skill Matching**: Intelligent matching of projects to freelancers
- **Trending Analysis**: Real-time trending projects and skills
- **File Management**: Secure file uploads and sharing
- **Transaction History**: Complete audit trail of all financial transactions
- **Dispute Resolution**: Built-in dispute management system

## 🛠 Tech Stack

### Frontend
- **Next.js 13+** with App Router
- **React 18** with hooks and context
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **React Query** for data fetching
- **Socket.io** for real-time features

### Backend
- **Node.js** with Express
- **Firebase Firestore** for database
- **Firebase Auth** for authentication
- **Firebase Realtime Database** for chat
- **Supabase Storage** for file management
- **JWT** for API authentication

### Development Tools
- **Jest** for testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Auth enabled
- Supabase account (optional, for file storage)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/BitNBuild-25_wednesdayhack.git
cd BitNBuild-25_wednesdayhack
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

#### Server Environment (.env)
```bash
# Copy the example file
cp server/.env.example server/.env

# Edit the environment variables
NODE_ENV=development
PORT=5000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# Supabase Configuration (Optional)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Client Environment (.env.local)
```bash
# Copy the example file
cp client/.env.example client/.env.local

# Edit the environment variables
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication
   - Enable Realtime Database

2. **Generate Service Account Key**
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file
   - Extract the values for your `.env` file

3. **Configure Authentication**
   - Enable Email/Password authentication
   - Set up custom claims for user roles

### 5. Database Setup

#### Run Database Migrations
```bash
cd server
npm run migrate
```

#### Seed the Database
```bash
npm run seed
```

### 6. Start the Development Servers

#### Start the Backend Server
```bash
cd server
npm run dev
```

#### Start the Frontend Development Server
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🧪 Testing

### Run All Tests
```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

### Run Specific Test Suites
```bash
# Escrow service tests
npm test -- --testPathPattern=escrow

# API route tests
npm test -- --testPathPattern=api

# Component tests
npm test -- --testPathPattern=components
```

### Test Coverage
```bash
npm run test:coverage
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Project Endpoints
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/recommendations` - Get recommendations
- `GET /api/projects/trending` - Get trending projects

### Escrow Endpoints
- `POST /api/projects/:id/escrow/deposit` - Deposit to escrow
- `GET /api/projects/:id/escrow/balance` - Get escrow balance
- `GET /api/projects/:id/transactions` - Get transaction history
- `POST /api/projects/:id/milestones/:mid/approve` - Approve milestone
- `POST /api/projects/:id/milestones/:mid/release` - Release milestone funds

### Team Endpoints
- `POST /api/teams` - Create team
- `GET /api/teams` - List teams
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/join` - Join team
- `POST /api/teams/:id/leave` - Leave team
- `PUT /api/teams/:id/members/:memberId/role` - Update member role

### Chat Endpoints
- `POST /api/chat/:projectId/messages` - Send message
- `GET /api/chat/:projectId/messages` - Get messages
- `POST /api/chat/:projectId/upload` - Upload file

### Admin Endpoints
- `GET /api/admin/transactions` - Get all transactions
- `POST /api/admin/transactions/adjust` - Adjust user balance
- `GET /api/admin/disputes` - Get disputes
- `POST /api/admin/disputes/:id/resolve` - Resolve dispute

## 🏗 Architecture

### Project Structure
```
BitNBuild-25_wednesdayhack/
├── client/                 # Next.js frontend
│   ├── components/         # React components
│   ├── pages/            # Next.js pages
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   └── styles/           # CSS styles
├── server/               # Node.js backend
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── tests/           # Test files
└── docs/                # Documentation
```

### Database Schema

#### Users Collection
```javascript
{
  id: string,
  email: string,
  name: string,
  role: 'student' | 'client' | 'admin',
  university_verified: boolean,
  university: string,
  wallet_balance: number,
  escrow_balance: number,
  skills: string[],
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Projects Collection
```javascript
{
  id: string,
  client_id: string,
  title: string,
  description: string,
  required_skills: string[],
  budget_min: number,
  budget_max: number,
  is_fixed_budget: boolean,
  deadline: timestamp,
  project_type: 'individual' | 'team',
  status: 'open' | 'in_progress' | 'completed',
  escrow_balance: number,
  milestones: Milestone[],
  created_at: timestamp
}
```

#### Teams Collection
```javascript
{
  id: string,
  name: string,
  description: string,
  leader_id: string,
  member_ids: string[],
  skills: string[],
  wallet_balance: number,
  created_at: timestamp
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure API access
- **Role-based Access Control**: Granular permissions
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API abuse prevention
- **File Upload Security**: Type and size validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🚀 Deployment

### Production Environment Variables
```bash
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=your-production-project
# ... other production values
```

### Build for Production
```bash
# Build client
cd client
npm run build

# Build server (if needed)
cd server
npm run build
```

### Deploy to Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

### Deploy to Railway (Backend)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd server
railway login
railway up
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/BitNBuild-25_wednesdayhack/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core project management
- ✅ Team collaboration
- ✅ Escrow system
- ✅ Real-time chat
- ✅ Admin dashboard

### Phase 2 (Planned)
- 🔄 Advanced analytics
- 🔄 Mobile app
- 🔄 Payment gateway integration
- 🔄 Advanced AI recommendations
- 🔄 Video calling integration

### Phase 3 (Future)
- 🔄 Blockchain integration
- 🔄 Cryptocurrency payments
- 🔄 Advanced dispute resolution
- 🔄 International expansion

## 🙏 Acknowledgments

- Firebase team for excellent backend services
- Next.js team for the amazing React framework
- Tailwind CSS for beautiful styling
- All contributors and testers

---

**Built with ❤️ by the BitNBuild team**