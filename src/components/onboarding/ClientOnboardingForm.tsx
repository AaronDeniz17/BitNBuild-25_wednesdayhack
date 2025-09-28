import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Building2, Shield } from 'lucide-react';

interface ClientOnboardingData {
  companyName: string;
  companyDescription: string;
  industry: string;
  companySize: string;
  website?: string;
  kycVerified: boolean;
}

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
  'Marketing', 'Real Estate', 'Manufacturing', 'Consulting', 'Non-profit',
  'Entertainment', 'Food & Beverage', 'Travel', 'Automotive', 'Other'
];

const companySizes = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

export function ClientOnboardingForm() {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClientOnboardingData>({
    companyName: '',
    companyDescription: '',
    industry: '',
    companySize: '',
    website: '',
    kycVerified: false,
  });

  const handleInputChange = (field: keyof ClientOnboardingData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!formData.companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please provide your company or organization name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.companyDescription.trim()) {
      toast({
        title: "Company description required",
        description: "Please provide a brief description of your company.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.industry) {
      toast({
        title: "Industry required",
        description: "Please select your industry.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.companySize) {
      toast({
        title: "Company size required",
        description: "Please select your company size.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'clients', user.uid), {
        ...formData,
        isOnboarded: true,
        updatedAt: new Date(),
      });

      await refreshProfile();
      
      toast({
        title: "Profile completed!",
        description: "Your client profile has been set up successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Complete Your Client Profile</CardTitle>
              <CardDescription>
                Tell us about your company to help students understand your projects better
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company/Organization Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyDescription">Company Description *</Label>
                    <Textarea
                      id="companyDescription"
                      placeholder="Describe what your company does, your mission, and key services..."
                      rows={4}
                      value={formData.companyDescription}
                      onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <select
                        id="industry"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        required
                      >
                        <option value="">Select industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size *</Label>
                      <select
                        id="companySize"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.companySize}
                        onChange={(e) => handleInputChange('companySize', e.target.value)}
                        required
                      >
                        <option value="">Select company size</option>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                </div>

                {/* KYC Verification */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">KYC Verification</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          For security and trust purposes, we require basic verification for all clients. 
                          This helps protect both you and our freelancers.
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Checkbox
                            id="kycVerified"
                            checked={formData.kycVerified}
                            onCheckedChange={(checked) => handleInputChange('kycVerified', checked as boolean)}
                          />
                          <Label htmlFor="kycVerified" className="text-sm">
                            I acknowledge that I may need to provide additional verification documents 
                            before posting high-value projects (placeholder for actual KYC process)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-sm mb-2">Terms of Service</h3>
                    <p className="text-sm text-muted-foreground">
                      By completing your profile, you agree to our Terms of Service and Privacy Policy. 
                      You understand that:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>All project payments will be processed through our secure escrow system</li>
                      <li>You are responsible for providing clear project requirements</li>
                      <li>Disputes will be handled through our resolution process</li>
                      <li>You must treat all freelancers with respect and professionalism</li>
                    </ul>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Setting Up Profile...' : 'Complete Profile & Start Hiring'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
