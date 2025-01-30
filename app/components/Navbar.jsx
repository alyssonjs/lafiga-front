import Link from 'next/link';
import styles from '../styles/NavBar.module.css';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
    <div className={styles.navbarBrand}>
    <Image src="./public/lafiga-pixel.svg" alt="Lafiga Logo" width={50} height={50} className={styles.navbarLogo} priority/>
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