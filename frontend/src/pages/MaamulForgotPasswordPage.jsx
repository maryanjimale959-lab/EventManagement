import Card from "../components/ui/Card.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import ForgotPasswordForm from "../components/ForgotPasswordForm.jsx";
import Logo from "../components/Logo.jsx";

/** Same standalone shell as MaamulLoginPage - no public navbar/footer. */
export default function MaamulForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-5">
      <div className="absolute top-5 right-5"><ThemeToggle /></div>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size={30} />
        </div>
        <Card>
          <h1 className="text-lg font-bold mt-0 mb-1 text-center">Reset administrator password</h1>
          <p className="text-muted text-center mt-0 mb-5 text-sm">We'll email a 6-digit code to confirm it's you.</p>
          <ForgotPasswordForm loginPath="/maamul/login" />
        </Card>
      </div>
    </div>
  );
}
