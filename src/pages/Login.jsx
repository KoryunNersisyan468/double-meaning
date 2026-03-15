import { AuthForm } from "../components";

export default function Login({onLoginSuccess}) {
  return <AuthForm onLoginSuccess={onLoginSuccess} />;
}
