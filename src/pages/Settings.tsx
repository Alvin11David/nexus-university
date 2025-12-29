import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

// Settings Tab Components
import { GeneratePRNTab } from '@/components/settings/GeneratePRNTab';
import { EnrollmentRegistrationTab } from '@/components/settings/EnrollmentRegistrationTab';
import { PaymentsTab } from '@/components/settings/PaymentsTab';
import { MyProgrammeTab } from '@/components/settings/MyProgrammeTab';
import { ServicesTab } from '@/components/settings/ServicesTab';
import { BioDataTab } from '@/components/settings/BioDataTab';
import { AcademicCalendarTab } from '@/components/settings/AcademicCalendarTab';
import { EvaluationSurveysTab } from '@/components/settings/EvaluationSurveysTab';

const settingsTabs = [
  { id: 'prn', label: 'Generate PRN', shortLabel: 'PRN' },
  { id: 'enrollment', label: 'Enrollment & Registration', shortLabel: 'Enrollment' },
  { id: 'payments', label: 'Payments', shortLabel: 'Payments' },
  { id: 'programme', label: 'My Programme', shortLabel: 'Programme' },
  { id: 'services', label: 'Services', shortLabel: 'Services' },
  { id: 'biodata', label: 'Bio Data', shortLabel: 'Bio Data' },
  { id: 'calendar', label: 'Academic Calendar', shortLabel: 'Calendar' },
  { id: 'surveys', label: 'Evaluation Surveys', shortLabel: 'Surveys' },
];

export default function Settings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('prn');

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{settingsTabs.find(t => t.id === activeTab)?.label}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Student Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your academic profile, payments, and services
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <TabsList className="inline-flex h-auto p-1 gap-1 bg-muted/50 backdrop-blur-sm">
                {settingsTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="px-4 py-2.5 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <span className="hidden lg:inline">{tab.label}</span>
                    <span className="lg:hidden">{tab.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="prn" className="mt-6">
              <GeneratePRNTab />
            </TabsContent>

            <TabsContent value="enrollment" className="mt-6">
              <EnrollmentRegistrationTab />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentsTab />
            </TabsContent>

            <TabsContent value="programme" className="mt-6">
              <MyProgrammeTab />
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <ServicesTab />
            </TabsContent>

            <TabsContent value="biodata" className="mt-6">
              <BioDataTab />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <AcademicCalendarTab />
            </TabsContent>

            <TabsContent value="surveys" className="mt-6">
              <EvaluationSurveysTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
