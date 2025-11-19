import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import architectureDiagram from "@assets/generated_images/CCIT_Study_Plan_Architecture_Diagram_089eb2fa.png";

export default function Architecture() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">System Architecture</h1>
        <p className="text-muted-foreground">
          Comprehensive block diagram showing the CCIT Study Plan system components and data flow
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Architecture Overview</CardTitle>
          <CardDescription>
            The CCIT Study Plan is a full-stack educational platform with AI-powered features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <img 
              src={architectureDiagram} 
              alt="CCIT Study Plan System Architecture Block Diagram"
              className="w-full h-auto rounded-md shadow-lg"
              data-testid="img-architecture-diagram"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frontend Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• React 18 with TypeScript</li>
              <li>• Vite build system</li>
              <li>• Wouter routing</li>
              <li>• TanStack Query for state</li>
              <li>• shadcn/ui components</li>
              <li>• Tailwind CSS styling</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Backend Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Express.js API server</li>
              <li>• Session-based auth</li>
              <li>• Drizzle ORM</li>
              <li>• RESTful endpoints</li>
              <li>• Role-based authorization</li>
              <li>• Async email service</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Neon PostgreSQL</li>
              <li>• UUID primary keys</li>
              <li>• Multi-program support</li>
              <li>• JSONB for flexibility</li>
              <li>• Foreign key relationships</li>
              <li>• Soft delete patterns</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">External Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• OpenAI GPT-5 (AI Quiz Gen)</li>
              <li>• Resend (Email delivery)</li>
              <li>• Replit Auth (OIDC)</li>
              <li>• Neon (Database hosting)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Personalized study plans</li>
              <li>• AI-generated quizzes</li>
              <li>• Pre/Post-Test system</li>
              <li>• Email notifications</li>
              <li>• Study reminders</li>
              <li>• Performance analytics</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security & Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Password hashing (bcrypt)</li>
              <li>• Session management</li>
              <li>• OIDC authentication</li>
              <li>• Role-based access</li>
              <li>• Email verification</li>
              <li>• Password reset flow</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
