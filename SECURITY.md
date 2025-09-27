# 🔐 Security Checklist for GigCampus

## ✅ Pre-Deployment Security Checklist

### **Environment Variables**
- [ ] All Firebase credentials are in environment variables (not hardcoded)
- [ ] `.env` files are in `.gitignore` and not committed
- [ ] Different credentials for development/staging/production
- [ ] No sensitive data in example files (only placeholder values)

### **Firebase Configuration**
- [ ] Server-side: Uses `process.env` variables in `server/config/firebase.js`
- [ ] Client-side: Uses `NEXT_PUBLIC_` prefixed variables in `client/lib/firebase.js`
- [ ] Runtime validation for required environment variables
- [ ] Proper error handling for missing credentials

### **Git Security**
- [ ] `.gitignore` includes `.env*` files
- [ ] No Firebase credentials in commit history
- [ ] Example files use placeholder values only
- [ ] Sensitive files are excluded from version control

### **Code Security**
- [ ] No hardcoded API keys or secrets
- [ ] JWT secrets use environment variables
- [ ] Database URLs use environment variables
- [ ] All external service credentials are externalized

## 🚨 Security Issues to Avoid

### **❌ NEVER DO:**
- Hardcode Firebase credentials in source code
- Commit `.env` files to version control
- Use production credentials in development
- Share credentials in chat/email/documentation
- Store credentials in client-side code (except public config)

### **✅ ALWAYS DO:**
- Use environment variables for all secrets
- Keep `.env` files local and private
- Use different credentials per environment
- Validate environment variables at startup
- Document security practices in README

## 🔧 Environment Setup

### **Development Environment**
```bash
# Server
cp server/env.example server/.env
# Edit server/.env with development Firebase credentials

# Client  
cp client/env.local.example client/.env.local
# Edit client/.env.local with development Firebase credentials
```

### **Production Environment**
```bash
# Set environment variables in your hosting platform
# Railway, Heroku, Vercel, etc.

# Server environment variables:
FIREBASE_PROJECT_ID=your-prod-project-id
FIREBASE_PRIVATE_KEY=your-prod-private-key
# ... other server variables

# Client environment variables:
NEXT_PUBLIC_FIREBASE_API_KEY=your-prod-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project-id
# ... other client variables
```

## 🛡️ Firebase Security Rules

### **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects are readable by all authenticated users
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.client_id == request.auth.uid || 
         request.auth.token.role == 'admin');
    }
    
    // Add more rules as needed...
  }
}
```

### **Storage Security Rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔍 Security Monitoring

### **Regular Checks**
- [ ] Review environment variables quarterly
- [ ] Rotate Firebase service account keys annually
- [ ] Monitor Firebase usage for unusual activity
- [ ] Check for exposed credentials in logs
- [ ] Verify `.gitignore` is working correctly

### **Deployment Verification**
- [ ] No credentials in build artifacts
- [ ] Environment variables are properly set
- [ ] Firebase rules are configured
- [ ] HTTPS is enforced
- [ ] CORS is properly configured

## 📞 Security Incident Response

### **If Credentials Are Exposed:**
1. **Immediately rotate** the exposed credentials
2. **Check commit history** for other exposed secrets
3. **Update all environments** with new credentials
4. **Review access logs** for unauthorized usage
5. **Document the incident** and prevention measures

### **Prevention Measures:**
- Use pre-commit hooks to scan for secrets
- Implement automated security scanning
- Regular security audits
- Team training on secure practices

## 🎯 Best Practices

1. **Principle of Least Privilege**: Only grant necessary Firebase permissions
2. **Defense in Depth**: Multiple layers of security
3. **Regular Updates**: Keep dependencies and Firebase SDK updated
4. **Monitoring**: Set up alerts for unusual activity
5. **Documentation**: Keep security practices documented and updated

---

**Remember**: Security is an ongoing process, not a one-time setup! 🔐
