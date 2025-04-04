
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Award, Users, BrainCircuit } from "lucide-react";

const FeatureCard = ({ icon, title, description, linkTo }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  linkTo: string
}) => (
  <div className="bg-card rounded-lg border shadow-sm p-6 transition-all hover:shadow-md">
    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <Link to={linkTo}>
      <Button variant="outline" className="w-full">Try Now</Button>
    </Link>
  </div>
);
