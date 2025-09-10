// pages/signup.js
"use client";

import { useState, useEffect } from "react";
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
import { register } from "../../_services/railsApi";
import { useAuth } from "../../_context/AuthContext";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);

  const router = useRouter();
  const { user, loginUser } = useAuth();

  // Se já estiver logado, redireciona à dashboard
  useEffect(() => {
    if (user) {
      router.push("/calendar");
    }
  }, [user, router]);  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      const response = await register({ name, username, phone, email, password, password_confirmation: passwordConfirmation, role_id: 12 });
      loginUser({
        token: response.token,
        user_infos: response.user_infos,
        role: response.role,
        permissions: response.permissions,
      });

      if (response.role === "admin") {
        router.push("/admin"); 
      } else {
        router.push("/calendar");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao registrar. Tente novamente.");
    }
  };

  return (
    <div className={styles.loginContainer}>
      Voce sera registrado como visitando e o mestre ira lhe dar a permissao de jogar

      <Card style={{ width: "300px" }}>
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1em" }}
          >
            <Input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="username"
              id="username"
              name="username"
              required
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="phone"
              id="phone"
              name="phone"
              required
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              id="passwordConfirmation"
              name="passwordConfirmation"
              required
              placeholder="Confirme a senha"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
            {error && <div className={styles.error}>Erro: {error}</div>}
            <Button
              variant="highlight"
              type="submit"
              className={styles.loginButton}
            >
              Registrar
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className={styles.signupText}>
            Já tem uma conta? <Link href="/login">Faça login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
