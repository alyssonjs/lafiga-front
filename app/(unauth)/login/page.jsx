"use client";

import { useState, useEffect } from "react"; // Add useEffect import
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../_styles/loginPage/Login.module.css";
import Card, {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../_components/UI/Card";
import Input from "../../_components/UI/Input";
import Button from "../../_components/UI/Button";
import { login } from "../../_services/railsApi";
import { useAuth } from "../../_context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user, loginUser } = useAuth();

  // Move the redirect logic to useEffect
  useEffect(() => {
    if (user) {
      router.push("/calendar");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await login({ email, password });
      loginUser({
        token: response.token,
        user_infos: response.user_infos,
        role: response.role,
        permissions: response.permissions,
      });

      if (response.role === "admin") {
        router.push("/calendar");
      } else if (response.role === "player") {
        router.push("/calendar");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card style={{ width: "300px" }}>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1em" }}
          >
            <Input
              type="text"
              id="username"
              name="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className={styles.error}>Erro: {error}</div>}
            <Button
              variant="highlight"
              type="submit"
              className={styles.loginButton}
            >
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className={styles.signupText}>
            Não tem uma conta? <Link href="/signup">Cadastre-se</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;