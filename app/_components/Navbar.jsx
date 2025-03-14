import Link from "next/link";
import styles from "../_styles/NavBar.module.css";
import Image from "next/image";
import Button from "./Button";

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <div className={styles.navbarBrand}>
        <Image
          src="lafiga_horz_filled.svg"
          alt="Lafiga Logo"
          width={150}
          height={100}
          className={styles.navbarLogo}
          priority
        />
      </div>
      {/* <div className={styles.navbarMenu}>
        <nav class="nav">
          <ul class="menu">
            <Link href="/calendar">
              <Button variant="primary">Quadro de sessões</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary">Login</Button>
            </Link>
          </ul>
        </nav>
        <Link href="/calendar">
            <Button variant="primary">Quadro de sessões</Button>
          </Link>
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
      </div> */}
    </div>
  );
};

export default Navbar;
