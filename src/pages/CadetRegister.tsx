import { CadetRegistrationForm } from "../components/CadetRegistrationForm";
import { useNavigate } from "react-router-dom";

export default function CadetRegisterPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl">
        <CadetRegistrationForm onSuccess={() => {
          // Redirect to auth page after successful registration
          navigate('/auth');
        }} />
      </div>
    </div>
  );
}
