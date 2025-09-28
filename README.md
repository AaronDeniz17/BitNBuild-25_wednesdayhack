# WorkLink Collab

A modern freelance collaboration platform with role-based authentication, escrow payments, and comprehensive project management features.

## 🚀 Features

### 🔐 Authentication & Onboarding
- **Role-based Authentication**: Separate login flows for Students, Clients, and Admins
- **Firebase Authentication**: Email/password authentication with SSO placeholder
- **Smart Onboarding**: Role-specific onboarding forms that redirect users appropriately

#### Student Onboarding
- Profile creation with skills selection (predefined + custom)
- Portfolio links (GitHub, Behance, LinkedIn, Website)
- Availability and hourly rate settings
- Bio and skill badges
- Firestore integration with `students` collection

#### Client Onboarding
- Company information and description
- Industry and company size selection
- KYC verification placeholder
- Firestore integration with `clients` collection

### 💰 Simulated Escrow & Payment System
- **Secure Escrow Workflow**: Client deposits → milestone approval → fund release
- **Milestone Management**: Project-based milestone tracking and approval
- **Partial Payments**: Prorated fund releases for partial completion
- **Dispute Resolution**: Admin-managed dispute system with resolution tracking

### 🏦 Wallet System
- **Balance Management**: Available and pending balance tracking
- **Transaction History**: Comprehensive transaction logging
- **Withdrawal System**: Simulated withdrawal requests
- **Real-time Updates**: Live transaction monitoring with Firestore listeners

### 🛡️ Admin Dashboard
- **Escrow Management**: Monitor all platform escrows and balances
- **Dispute Resolution**: Review and resolve client-freelancer disputes
- **Balance Adjustments**: Manual fund transfers, refunds, and holds
- **Platform Analytics**: Real-time statistics and performance metrics

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for modern UI components
- **Framer Motion** for animations
- **React Router** for navigation

### Backend
- **Firebase Firestore** for database
- **Firebase Authentication** for user management
- **Firebase Storage** for file uploads
- **Real-time listeners** for live updates

### Collections Structure
```
firestore/
├── students/           # Student profiles
├── clients/           # Client profiles  
├── admins/            # Admin profiles
├── escrows/           # Escrow accounts
├── wallets/           # User wallets
├── disputes/          # Dispute records
└── admin_actions/     # Admin activity logs
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Anaay2306/worklink-collab
cd worklink-collab
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password provider)
   - Enable Firestore Database (start in test mode)
   - Get your Firebase config from Project Settings > General > Your apps

4. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Replace the Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. **Start development server**
```bash
npm run dev
```

## 🎯 Usage

### Getting Started
1. **Sign Up**: Choose your role (Student/Client/Admin) and create an account
2. **Onboarding**: Complete the role-specific onboarding process
3. **Dashboard**: Access your personalized dashboard with role-based features

### For Students
- Complete profile with skills and portfolio
- Browse and apply for projects
- Track earnings in wallet
- Manage project milestones

### For Clients
- Set up company profile
- Post projects with escrow funding
- Manage milestone approvals
- Handle payments through escrow system

### For Admins
- Monitor platform activity
- Resolve disputes between users
- Manage escrow balances
- View platform analytics

## 🔒 Security Features

- **Role-based Access Control**: Strict permission system
- **Secure Escrow**: Funds held securely until milestone completion
- **Data Validation**: Comprehensive input validation and sanitization
- **Firebase Security Rules**: Database-level security enforcement

## 🚀 Deployment

The application is ready for deployment on platforms like:
- **Vercel** (recommended for Vite projects)
- **Netlify**
- **Firebase Hosting**

### Deploy to Vercel
```bash
npm run build
# Deploy the dist/ folder to Vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Powered by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Framer Motion](https://www.framer.com/motion/)

---

**WorkLink Collab** - Connecting talent with opportunity through secure, transparent collaboration.
