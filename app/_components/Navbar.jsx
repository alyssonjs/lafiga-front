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
    </div>
  );
};

export default Navbar;
