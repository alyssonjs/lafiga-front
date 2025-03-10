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

const LoginPage = () => {
  return (
    <div className={styles.loginContainer}>
      <Card style={{ width: "300px" }}>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
            <Input
              type="text"
              id="username"
              name="username"
              required
              placeholder="Username"
            />
            <Input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <div className={styles.footer}>
            <Button className={styles.loginButton} variant="highlight">Entrar</Button>
            <p className={styles.signupText}>
              Não tem uma conta? <Link href="/signup">Cadastre-se</Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
  // return (
  //   <div className={styles.loginContainer}>
  //     <h1 className={styles.loginTitle}>Login</h1>
  //     <form className={styles.loginForm}>
  //       <label htmlFor="username">Usuário:</label>
  //       <input type="text" id="username" name="username" required />

  //       <label htmlFor="password">Senha:</label>
  //       <input type="password" id="password" name="password" required />

  //       <button type="submit" className={styles.loginButton}>Entrar</button>
  //     </form>
  //     <p className={styles.signupText}>
  //       Não tem uma conta? <Link href="/signup">Cadastre-se</Link>
  //     </p>
  //   </div>
  // );
};

export default LoginPage;
