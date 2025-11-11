import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Calendar, ChartLine, BookOpen, Target, Users } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-display">CCIT Study Plan</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button data-testid="button-signup">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
                Master Your Studies with AI-Powered Learning
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                Personalized study plans, adaptive quizzes, and intelligent insights designed specifically for CCIT students. Transform your learning journey today.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" className="text-base px-8" data-testid="button-get-started">
                    Get Started Free
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Join <span className="font-semibold text-foreground">500+ CCIT students</span> improving their grades
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Brain className="h-32 w-32 md:h-48 md:w-48 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold font-display">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete study system powered by AI to help you learn smarter, not harder
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Personalized Study Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Create custom study schedules based on your available time, learning goals, and subject preferences
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">AI-Generated Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Adaptive assessments created by ChatGPT based on your subjects and study materials
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <ChartLine className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track your progress with detailed insights on strengths, weaknesses, and improvement areas
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Study Materials Library</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Access curated PDFs and resources for all CCIT subjects, organized and ready to download
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Goal Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Set learning objectives and monitor your progress toward achieving academic excellence
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Custom Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Add your own subjects if you're an irregular student with a unique curriculum
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold font-display">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and transform your study routine
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold font-display">Create Your Account</h3>
                <p className="text-muted-foreground">
                  Sign up in seconds and set up your student profile
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold font-display">Build Your Study Plan</h3>
                <p className="text-muted-foreground">
                  Select subjects, set your available study times, and define learning goals
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold font-display">Take AI Quizzes</h3>
                <p className="text-muted-foreground">
                  Test your knowledge with personalized quizzes generated based on your materials
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold font-display">Track Your Progress</h3>
                <p className="text-muted-foreground">
                  View detailed analytics on your performance and get AI-powered study recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg md:text-xl opacity-90">
              Join hundreds of CCIT students who are already achieving better grades with personalized, AI-powered study plans
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="text-base px-8" data-testid="button-cta-signup">
                  Start Learning Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold font-display">CCIT Study Plan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 CCIT Study Plan. Empowering students through AI-powered learning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
