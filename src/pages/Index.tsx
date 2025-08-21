const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Cadet Information Management System</h1>
        <p className="text-xl text-muted-foreground mb-8">Manage your school cadet platoon information efficiently</p>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">Access the system to view and manage cadet records</p>
          <a 
            href="/auth" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Login to System
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
