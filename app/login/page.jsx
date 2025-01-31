import Link from 'next/link';
import styles from '../_styles/Login.module.css';

const LoginPage = () => {
  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.loginTitle}>Login</h1>
      <form className={styles.loginForm}>
        <label htmlFor="username">Usuário:</label>
        <input type="text" id="username" name="username" required />

        <label htmlFor="password">Senha:</label>
        <input type="password" id="password" name="password" required />

        <button type="submit" className={styles.loginButton}>Entrar</button>
      </form>
      <p className={styles.signupText}>
        Não tem uma conta? <Link href="/signup">Cadastre-se</Link>
      </p>
    </div>
  );
};

export default LoginPage;