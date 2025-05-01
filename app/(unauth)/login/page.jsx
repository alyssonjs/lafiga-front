"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../_styles/Login.module.css";
import Card, {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../_components/Card";
import Input from "../../_components/Input";
import Button from "../../_components/Button";
import { login } from "../../_services/railsApi";
import { useAuth } from "../../_context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter(); // para redirecionamento
  const { user, loginUser } = useAuth();

  // redirects the user if user is logged in.

  if (user) {
    router.push("/calendar");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await login({ email, password });
      console.log("Login realizado com sucesso:", response);
      
      // Store the data in a context and keeps the login
      loginUser({
        token: response.token,
        user_infos: response.user_infos,
        role: response.role,
        permissions: response.permissions,
      });


      // Not implemented yet, but should redirect to admin screen or
      // player screen
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
