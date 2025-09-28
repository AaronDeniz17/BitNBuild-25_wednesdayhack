import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { GraduationCap, Building2, ShieldCheck } from 'lucide-react';

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
  onBack?: () => void;
}

export function RoleSelector({ onRoleSelect, onBack }: RoleSelectorProps) {
  const roles = [
    {
      role: 'student' as UserRole,
      title: 'Student',
      description: 'Join as a student to find freelance projects and build your portfolio',
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      role: 'client' as UserRole,
      title: 'Client',
      description: 'Post projects and hire talented students for your business needs',
      icon: Building2,
      color: 'from-purple-500 to-pink-500',
    },
    {
      role: 'admin' as UserRole,
      title: 'Admin',
      description: 'Manage the platform and resolve disputes',
      icon: ShieldCheck,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Choose Your Role</h1>
        <p className="text-muted-foreground">
          Select how you'd like to use WorkLink Collab
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {roles.map((roleData, index) => {
          const Icon = roleData.icon;
          return (
            <motion.div
              key={roleData.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group"
                onClick={() => onRoleSelect(roleData.role)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${roleData.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{roleData.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {roleData.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {onBack && (
        <div className="text-center">
          <Button variant="outline" onClick={onBack}>
            Back to Login
          </Button>
        </div>
      )}
    </div>
  );
}
