import Link from 'next/link';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
    <div className={styles.navbarBrand}>
        <span className={styles.navbarLogo}>Lafiga</span>
    </div>
    <div className={styles.navbarMenu}>
        <Link href="/session" className={styles.navbarLink}>
        Quadro de sessões
        </Link>
        <Link href="/login" className={styles.navbarLink}>
        Login
        </Link>
    </div>
    </nav>
  );
};

export default Navbar;