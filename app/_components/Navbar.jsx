import Link from "next/link";
import styles from "../_styles/NavBar.module.css";
import Image from "next/image";
import Button from "./Button";

const Navbar = () => {
  return (
    <nav className={styles.header}>
      <div className={styles.navbar}>
        <div></div>
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
        <div className={styles.navbarMenu}>
          <Link href="/session">
            <Button variant="primary">Quadro de sessões</Button>
          </Link>
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </div>
      <div className={styles.jaggedBorder}>
        <div className={styles.jagged}></div>
      </div>
    </nav>
  );
  // return (
  //   <nav className={styles.navbar}>
  //     <div className={styles.navbarBrand}>
  //       <Image
  //         src="./public/lafiga-pixel.svg"
  //         alt="Lafiga Logo"
  //         width={50}
  //         height={50}
  //         className={styles.navbarLogo}
  //         priority
  //       />
  //     </div>
  //     <div className={styles.navbarMenu}>
  //       <Link href="/session" className={styles.navbarLink}>
  //         Quadro de sessões
  //       </Link>
  //       <Link href="/login" className={styles.navbarLink}>
  //         Login
  //       </Link>
  //     </div>
  //   </nav>
  // );
};

export default Navbar;
